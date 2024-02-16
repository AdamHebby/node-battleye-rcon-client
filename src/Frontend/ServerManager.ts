import Server from "../Models/Server";
import $ from "jquery";

class ServerSetting {
    public tempId: string;
    public new: boolean = false;
    public id: number = 0;
    public address: string = '';
    public name: string = '';
    public port: number = 0;
    public password: string = '';

    public originalAddress: string = '';
    public originalName: string = '';
    public originalPort: number = 0;
    public originalPassword: string = '';

    public constructor() {
        this.tempId = Math.random().toString(36).substring(2, 12);
    }

    public static fromServer(server: Server): ServerSetting {
        let setting = new ServerSetting();
        setting.id = server.id;
        setting.address = server.address;
        setting.name = server.name;
        setting.port = server.port;
        setting.password = server.password;

        setting.originalAddress = server.address;
        setting.originalName = server.name;
        setting.originalPort = server.port;
        setting.originalPassword = server.password;

        return setting;
    }

    public isDirty(): boolean {
        return this.new ||
            this.address  !== this.originalAddress ||
            this.name     !== this.originalName ||
            this.port     !== this.originalPort ||
            this.password !== this.originalPassword;
    }

    public validate(): boolean {
        return this.address !== '' && this.name !== '' && this.port > 0 && this.password !== '';
    }

    public getElement(): JQuery<HTMLElement> {
        let tr = $('<tr>')
            .attr('data-server-id', this.id)
            .attr('data-temp-id', this.tempId)
            .attr('data-new', this.new.toString())
            .attr('data-dirty', this.isDirty().toString())
            .addClass(this.isDirty() ? 'dirty' : '');

        tr.append($('<td>')
            .append($('<input>')
            .attr('type', 'text')
            .attr('name', 'name')
            .val(this.name)
            .attr('required', 'required')));

        tr.append($('<td>')
            .append($('<input>')
            .attr('type', 'text')
            .attr('name', 'address')
            .val(this.address)
            .attr('required', 'required')));

        tr.append($('<td>')
            .append($('<input>')
            .attr('type', 'number')
            .attr('name', 'port')
            .val(this.port)
            .attr('required', 'required')));

        tr.append($('<td>')
            .append($('<input>')
            .attr('type', 'password')
            .attr('name', 'password')
            .val(this.password)
            .attr('required', 'required')));

        tr.append($('<td>')
            .append($('<button>')
            .addClass('btn btn-danger')
            .attr('data-server-action', 'delete')
            .text('Delete')));

        return tr;
    }

    public toServer(): Server {
        return Server.fromJson({
            id: this.id,
            name: this.name,
            address: this.address,
            port: this.port,
            password: this.password
        });
    }

    public reset(): void {
        this.address = this.originalAddress;
        this.name = this.originalName;
        this.port = this.originalPort;
        this.password = this.originalPassword;
    }

    public save(): void {
        this.originalAddress = this.address;
        this.originalName = this.name;
        this.originalPort = this.port;
        this.originalPassword = this.password;
    }
}

class ServerManager {
    public servers: ServerSetting[] = [];
    public tableBody: JQuery<HTMLElement>;
    public resetButton: JQuery<HTMLElement>;
    public saveButton: JQuery<HTMLElement>;
    public addServerButton: JQuery<HTMLElement>;

    public onSave: CallableFunction|null = null;
    public onDelete: CallableFunction|null = null;

    constructor(
        tableBody: JQuery<HTMLElement>,
        resetButton: JQuery<HTMLElement>,
        saveButton: JQuery<HTMLElement>,
        addServerButton: JQuery<HTMLElement>,
    ) {
        this.tableBody = tableBody;
        this.resetButton = resetButton;
        this.saveButton = saveButton;
        this.addServerButton = addServerButton;

        $(this.resetButton).on('click', () => this.reset());
        $(this.saveButton).on('click', () => this.save());
        $(this.tableBody).on('change input', 'input', (e) => this.input(e));
        $(this.addServerButton).on('click', () => this.newServer());

        this.registerActions();
    }

    public newServer(): ServerSetting {
        let server = new ServerSetting();
        server.new = true;

        this.servers.push(server);

        this.render();

        return server;
    }

    public addServer(server: Server): ServerSetting {
        let setting = ServerSetting.fromServer(server);
        this.servers.push(setting);

        return setting;
    }

    public removeServer(id: number|string): void {
        let server: Server = this.servers.find((server) => server.id === id || server.tempId === id)?.toServer() as Server;

        this.servers = this.servers.filter(function (server) {
            return server.id !== id && server.tempId !== id;
        });

        $(this.tableBody).find('tr[data-server-id="' + id + '"]').remove();
        $(this.tableBody).find('tr[data-temp-id="' + id + '"]').remove();

        if (this.onDelete !== null && server.id !== 0) {
            this.onDelete(server);
        }
    }

    public render(): void {
        this.servers.forEach((server) => {
            let tr = $(this.tableBody).find('tr[data-temp-id="' + server.tempId + '"]');
            if (tr.length === 0) {
                $(this.tableBody).append(server.getElement());
            } else {
                tr.replaceWith(server.getElement());
            }
        });

        this.updateButtons();
    }

    public isDirty(): boolean {
        return this.servers.some((server) => server.isDirty());
    }

    public validate(): boolean {
        return this.servers.every((server) => server.validate());
    }

    public reset(): void {
        this.servers = this.servers.filter((server) => !server.new);
        this.servers.forEach((server) => server.reset());
        $(this.tableBody).empty();
        this.render();
    }

    public update(servers: Server[]): void {
        this.servers = servers.map((server) => {
            let setting = this.servers.find((setting) => setting.id === server.id);

            if (setting !== undefined) {
                setting.address = server.address;
                setting.name = server.name;
                setting.port = server.port;
                setting.password = server.password;
                setting.new = false;
            }

            return setting ?? this.addServer(server);
        });

        this.empty();
        this.render();
    }

    public save(): void {
        if (!this.validate()) {
            return;
        }

        this.servers.forEach((server) => {
            server.save();
        });

        let servers = this.servers.map((server) => server.toServer());

        if (this.onSave !== null) {
            this.onSave(servers);
        }
    }

    public empty(): void {
        this.servers = this.servers.filter((server) => !server.isDirty());
        $(this.tableBody).empty();
    }

    public input(event: JQuery.TriggeredEvent<HTMLElement, undefined, any, any>): void {
        this.servers.forEach((server) => {
            let tr = $(this.tableBody).find('tr[data-temp-id="' + server.tempId + '"]');

            server.name     = tr.find('input[name="name"]').val() as string;
            server.address  = tr.find('input[name="address"]').val() as string;
            server.port     = parseInt(tr.find('input[name="port"]').val() as string);
            server.password = tr.find('input[name="password"]').val() as string;

            tr.toggleClass('dirty', server.isDirty());
        });

        this.updateButtons();
    }

    public updateButtons(): void {
        if (this.isDirty()) {
            $(this.resetButton).prop('disabled', false);
            $(this.saveButton).prop('disabled', this.validate() === false);
        } else {
            $(this.resetButton).prop('disabled', true);
            $(this.saveButton).prop('disabled', true);
        }
    }

    public registerActions(): void {
        $(this.tableBody).on('click', 'button[data-server-action="delete"]', (event) => {
            let id = $(event.target).closest('tr').attr('data-temp-id');

            $(event.target).closest('tr').remove();

            if (id === undefined) {
                return;
            }

            this.removeServer(id);
        });
    }
}

export default ServerManager;