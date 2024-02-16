class Server {
    public id: number = 0;
    public name: string = "";
    public address: string;
    public port: number;
    public password: string;
    public lastConnected: null|Date = null;

    public constructor(
        id: number,
        name: string,
        ip: string,
        port: number,
        password: string,
        lastConnected: Date = new Date()
    ) {
        this.id = id;
        this.name = name;
        this.address = ip;
        this.port = port;
        this.password = password;
        this.lastConnected = lastConnected;
    }

    public static fromJson(json: any): Server {
        return new Server(json.id, json.name, json.address, json.port, json.password, new Date(json.lastConnected));
    }

    public toJson(): any {
        return {
            id: this.id,
            name: this.name,
            address: this.address,
            port: this.port,
            password: this.password,
            lastConnected: this.lastConnected?.toISOString()
        };
    }

    public connected(): void {
        this.lastConnected = new Date();
    }
}

export default Server;
