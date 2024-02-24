import $ from "jquery";
import ServerEvents from "../ServerEvents";
import { ConsoleColor } from "../Models/ConsoleColors";
import ConsoleColorManager from "./ConsoleColorManager";

declare type TConsoleData = string|number|boolean|undefined|null|{
    data: unknown;
    id?: number;
    message?: string;
    player?: {
        guid: string;
        id: number;
    };
};

class Console {
    public autoscroll: boolean = true;
    private static instance: Console;
    private colors: ConsoleColor[] = [];
    public maxItems: number = 300;

    public onChat: (message: string) => void = () => {};
    public onCommand: (command: string) => void = () => {};

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
                } else {
                    this.onChat(message);
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
        $('#console').empty();
    }

    public error(message: TConsoleData) {
        this.logEvent(ServerEvents.CHAT_ERROR, message);
    }

    public warn(message: TConsoleData) {
        this.logEvent(ServerEvents.CHAT_ERROR, message);
    }

    public debug(message: TConsoleData) {
        this.logEvent(ServerEvents.CHAT_DEBUG, message);
    }

    public log(message: TConsoleData) {
        this.logEvent(ServerEvents.MESSAGE, message);
    }

    public logEvent(event: ServerEvents, data: TConsoleData) {
        if (typeof data === 'object' && data !== null && data.data !== undefined)  {
            if (typeof data.data === 'object') {
                data = 'OBJECT: ' + JSON.stringify(data.data);
            } else {
                data = data.data.toString();
            }
        }

        if (event === ServerEvents.RCON_DISCONNECT) data = 'RCon Disconnected';
        if (event === ServerEvents.RCON_CONNECT) data = 'RCon Connected';
        if (event === ServerEvents.RCON_RECONNECT) data = 'RCon Reconnected';
        if (event === ServerEvents.SOCK_OPEN) data = 'Socket Opened';
        if (event === ServerEvents.SOCK_CLOSE) data = 'Socket Closed';
        if (event === ServerEvents.SOCK_ERROR) data = 'Socket Error: ' + data;
        if (event === ServerEvents.SOCK_RECONNECT) data = 'Socket Reconnected';
        if (event === ServerEvents.CHAT_DEBUG) data = 'DEBUG: ' + data;
        if (event === ServerEvents.CHAT_ERROR) data = 'ERROR: ' + data;

        if (data === null) {
            data = 'No data provided';
        }

        let msg = $(`<span class="message ${event}" data-event="${event}">`).html(`${data}`);

        this.record(msg, event);
    }

    private colorize(event: ServerEvents, element: JQuery<HTMLElement>): JQuery<HTMLElement> {
        let color = this.colors.find((color: ConsoleColor) => color.event.toUpperCase() === event.toUpperCase());

        if (color && color.enabled) {
            element = $(element).css('color', color.color);
        }

        return element;
    }

    private record(message: JQuery<HTMLElement>, event: ServerEvents): void {
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
