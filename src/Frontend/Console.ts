import $ from "jquery";
import Events from "../Events";
import { ConsoleColor } from "../Models/ConsoleColors";
import ConsoleColorManager from "./ConsoleColorManager";

class Console {
    public autoscroll: boolean = true;
    private static instance: Console;
    private colors: ConsoleColor[] = [];
    public maxItems: number = 300;

    public onChat: (message: string) => void = (message: string) => {};
    public onCommand: (command: string) => void = (command: string) => {};

    public constructor() {
        if (Console.instance) {
            return Console.instance;
        }

        $('#console-input-text').on('keypress', (event) => {
            if (event.which === 13) {
                let mode = parseInt($('#console-input-mode').val() as string);
                let message = $('#console-input-text').val() as string;

                if (mode === 0) {
                    this.onCommand(message);
                    this.logEvent(Events.CHAT_DEBUG, `Command: ${message}`);
                } else {
                    this.onChat(message);
                    this.logEvent(Events.CHAT_DEBUG, `Chat: ${message}`);
                }

                $('#console-input-text').val('');
            }
        });

        ConsoleColorManager.getInstance().onUpdate = (consoleColors: ConsoleColor[]) => {
            this.colors = consoleColors;
        };

        this.colors = ConsoleColorManager.getInstance().consoleColors;

        Console.instance = this;

        let log = this.log.bind(this);
        let error = this.error.bind(this);
        let warn = this.warn.bind(this);
        window.console.log = log;
        window.console.error = error;
        window.console.warn = warn;

        console.log('test');
        console.error('test');
        console.warn('test');

        this.clear();
        this.scrollBottom();

        $('#autoscroll-toggle').on('click', () => {
            this.autoscroll = !this.autoscroll;
            if (this.autoscroll) {
                this.scrollBottom();
                $('#autoscroll-toggle').removeClass('disabled');
            } else {
                $('#autoscroll-toggle').addClass('disabled');
            }
        });
    }

    public static getInstance(): Console {
        if (Console.instance === undefined) {
            Console.instance = new Console();
        }

        return Console.instance;
    }

    public clear() {
        $('#console').text('');
    }

    public error(message: string|object|number|boolean|undefined|null) {
        this.logEvent(Events.CHAT_ERROR, message);
    }

    public warn(message: string|object|number|boolean|undefined|null) {
        this.logEvent(Events.CHAT_ERROR, message);
    }

    public debug(message: string|object|number|boolean|undefined|null) {
        this.logEvent(Events.CHAT_DEBUG, message);
    }

    public log(message: string|object|number|boolean|undefined|null) {
        this.logEvent(Events.MESSAGE, message);
    }

    public logEvent(event: Events, data: any = null) {
        if (typeof data === 'object') {
            if (typeof data.data === 'object') {
                data = 'OBJECT: ' + JSON.stringify(data.data);
            } else {
                data = data.data;
            }
        }

        if (event === Events.RCON_DISCONNECT) data = 'RCon Disconnected';
        if (event === Events.RCON_CONNECT) data = 'RCon Connected';
        if (event === Events.RCON_RECONNECT) data = 'RCon Reconnected';
        if (event === Events.SOCK_OPEN) data = 'Socket Opened';
        if (event === Events.SOCK_CLOSE) data = 'Socket Closed';
        if (event === Events.SOCK_ERROR) data = 'Socket Error: ' + data;
        if (event === Events.SOCK_RECONNECT) data = 'Socket Reconnected';
        if (event === Events.CHAT_DEBUG) data = 'DEBUG: ' + data;
        if (event === Events.CHAT_ERROR) data = 'ERROR: ' + data;

        if (data === null) {
            data = 'No data provided';
        }

        this.record(
            $(`<span class="message ${event}" data-event="${event}">`).text(`${data}`),
            event
        );
    }

    private colorize(event: Events, element: JQuery<HTMLElement>): JQuery<HTMLElement> {
        let color = this.colors.find((color: ConsoleColor) => color.event.toUpperCase() === event.toUpperCase());

        if (color && color.enabled) {
            element = $(element).css('color', color.color);
        }

        return element;
    }

    private msg(event: Events) {
        return $(`<span class="message ${event}" data-event="${event}">`);
    }

    private record(message: JQuery<HTMLElement>, event: Events): void {
        let currentTime = new Date().toLocaleTimeString();

        this.colorize(event, $(`
            <div class="record">
                <span class="time">${currentTime}: </span>
            </div>`
        ).append(message)).appendTo('#console');

        if ($('#console').children().length > this.maxItems) {
            $('#console').children().first().remove();
        }

        if (this.autoscroll) {
            this.scrollBottom();
        }
    }

    public scrollBottom() {
        $('#console').scrollTop($('#console')[0]?.scrollHeight ?? 0);
    }
}

export default Console;
