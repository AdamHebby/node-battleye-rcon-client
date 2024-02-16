// @ts-ignore
import Ban from "../Models/Ban";
import Server from "../Models/Server";
import $ from "jquery";
import { EventEmitter } from "events";
import ServerEvents from "../ServerEvents";
import Settings from "../Models/Settings";
import SettingsManager from "./SettingsManager";
import VariableTimer from "../VariableTimer";
import Console from "./Console";

// https://www.battleye.com/support/documentation/
class Nart {
    public static instance: Nart;
    public socket: WebSocket | null;
    public serverId: null|number = null;
    public eventEmitter: EventEmitter = new EventEmitter();
    public autoRefreshPlayersInterval: VariableTimer;
    public autoRefreshTime: number = 4000;
    public reconnectTimer: VariableTimer;

    private lastAutoRefreshPlayers: number = new Date().getTime();
    private callbacks: any = {};

    public static WEBSOCKET_URL = 'ws://localhost:12639';

    public constructor() {
        this.socket = new WebSocket(Nart.WEBSOCKET_URL);
        this.setupSocket();

        this.autoRefreshPlayersInterval = new VariableTimer('AutoRefreshPlayers', () => {
            let secondsSinceLastAutoRefresh = Math.round((new Date().getTime() - this.lastAutoRefreshPlayers) / 1000);
            $('#server-refresh-status').text(secondsSinceLastAutoRefresh + 's');
            $('#server-refresh-progress').width(
                (secondsSinceLastAutoRefresh / (this.autoRefreshTime / 1000)) * 100 + '%'
            );
        }, 500);

        this.reconnectTimer = new VariableTimer('ReconnectTimer', () => {
            this.socket = new WebSocket(Nart.WEBSOCKET_URL);
            if (this.socket !== null) {
                this.setupSocket();
                this.eventEmitter.emit(ServerEvents.SOCK_RECONNECT);
            }
        }, 5000);
    }

    private setupSocket() {
        if (this.socket === null) {
            return;
        }

        this.socket.onclose = () => {
            this.eventEmitter.emit(ServerEvents.SOCK_CLOSE);
            this.socket = null;
            this.reconnectTimer.start();
        }

        this.socket.onopen = () => {
            this.reconnectTimer.stop();

            Console.getInstance().logEvent(ServerEvents.SOCK_OPEN, "Connected to Nart");
            this.eventEmitter.emit(ServerEvents.SOCK_OPEN);

            Console.getInstance().onChat = (message: string) => {
                this.messageAll(message);
            };

            Console.getInstance().onCommand = (message: string) => {
                // this.sendCommand(Events.);
                console.log('Command: ' + message);
            };
        };

        let ignoreLogEvents = [
            ServerEvents.PLAYERS,
            ServerEvents.BANS,
            ServerEvents.ADMINS,

            ServerEvents.SETTINGS_LIST,
            ServerEvents.SETTINGS_SAVE,

            ServerEvents.SERVERS_LIST,
            ServerEvents.SERVER_DELETE,
            ServerEvents.SERVERS_SAVE,

            ServerEvents.COLORS_LIST,
            ServerEvents.COLORS_SAVE,

            ServerEvents.CHAT_PLAYER_JOIN,
            ServerEvents.CHAT_PLAYER_LEAVE,
        ];

        this.socket.onmessage = (event: MessageEvent) => {
            let data = JSON.parse(event.data);

            if (!ignoreLogEvents.includes(data.type)) {
                Console.getInstance().logEvent(data.type, data);
            }

            if (data.type === ServerEvents.VERSION) {
                this.eventEmitter.emit(ServerEvents.VERSION, data.data);
                return;
            }

            if (data.type === ServerEvents.CHAT_PLAYER_JOIN) {
                this.eventEmitter.emit(ServerEvents.CHAT_PLAYER_JOIN, data.data);

                Console.getInstance().logEvent(ServerEvents.CHAT_PLAYER_JOIN, data.data.message);
                return;
            }

            if (data.type === ServerEvents.CHAT_PLAYER_LEAVE) {
                this.eventEmitter.emit(ServerEvents.CHAT_PLAYER_LEAVE, data.data);

                Console.getInstance().logEvent(ServerEvents.CHAT_PLAYER_LEAVE, data.data.message);
                return;
            }

            if (data.type === ServerEvents.COLORS_LIST) {
                this.eventEmitter.emit(ServerEvents.COLORS_LIST, data.data);
                return;
            }

            if (data.type === ServerEvents.COLORS_SAVE) {
                this.eventEmitter.emit(ServerEvents.COLORS_SAVE, data.data);
                return;
            }

            if (data.type === ServerEvents.SETTINGS_LIST) {
                let manager = SettingsManager.getInstance();
                manager.update(data.data as Settings);

                this.autoRefreshTime = Math.min(
                    manager.settings.get('bans-refresh-interval') * 1000,
                    manager.settings.get('players-refresh-interval') * 1000,
                    manager.settings.get('admins-refresh-interval') * 1000,
                )

                this.eventEmitter.emit(ServerEvents.SETTINGS_LIST, data.data);
                return;
            }

            if (data.type === ServerEvents.ADMINS) {
                this.eventEmitter.emit(ServerEvents.ADMINS, data.data);
                return;
            }

            if (data.type === ServerEvents.SETTINGS_SAVE) {
                this.eventEmitter.emit(ServerEvents.SETTINGS_SAVE, data);
                return;
            }

            if (data.type === ServerEvents.SERVERS_LIST) {
                this.eventEmitter.emit(ServerEvents.SERVERS_LIST, data);
                return;
            }

            // if (data.type === Events.SOCK_ERROR) {
            //     Console.getInstance().logEvent(Events.SOCK_ERROR, data.data);
            //     return;
            // }

            // if (data.type === Events.MESSAGE) {
            //     Console.getInstance().logEvent(Events.MESSAGE, data.data);
            //     return;
            // }

            if (data.type === ServerEvents.PLAYERS) {
                this.lastAutoRefreshPlayers = new Date().getTime();
                let players = data.data;

                this.eventEmitter.emit(ServerEvents.PLAYERS, players);
                return;
            }

            if (data.type === ServerEvents.BANS) {
                let bans: Ban[] = [];

                data.data.forEach(function (ban: any) {
                    bans.push(Ban.fromJson(ban));
                });

                this.eventEmitter.emit(ServerEvents.BANS, bans);

                return;
            }

            if (data.type === ServerEvents.RCON_DISCONNECT) {
                this.autoRefreshPlayersInterval.stop();
                this.eventEmitter.emit(ServerEvents.RCON_DISCONNECT);
            }

            if (data.type === ServerEvents.RCON_CONNECT) {
                this.serverId = data.data.id;
                this.eventEmitter.emit(ServerEvents.RCON_CONNECT, this.serverId);
                this.autoRefreshPlayersInterval.start(500);
            }

            if (this.callbacks[data.type] !== undefined) {
                this.callbacks[data.type](data);
            }

            if (this.callbacks[data.id] !== undefined) {
                this.callbacks[data.id](data);
                delete this.callbacks[data.id];
            }
        }
    }

    public static getInstance(): Nart {
        if (Nart.instance === undefined) {
            Nart.instance = new Nart();
        }

        return Nart.instance;
    }

    public addListener(event: string, callable: CallableFunction): void {
        this.callbacks[event] = callable;
    }

    public sendCommand(command: string, data: any, callable: CallableFunction|null = null): void {
        let id = Math.random().toString(36).substring(7);

        this.socket?.send(JSON.stringify({
            type: command,
            id: id,
            data: data
        }));

        if (callable !== null) {
            this.addListener(id, callable);
        }
    }

    public connect(serverId: number) {
        this.serverId = serverId;
        this.sendCommand(ServerEvents.RCON_CONNECT, {id: serverId});
    }

    public messageUser(id: number, message: string) {
        this.sendCommand(ServerEvents.CHAT_PRIVATE_MESSAGE, {id: id, message: message});
    }

    public messageAll(message: string) {
        this.sendCommand(ServerEvents.CHAT_ADMIN_MESSAGE, {message: message});
    }

    public kickUser(id: number, reason: string) {
        this.sendCommand(ServerEvents.USER_KICK, {id: id, reason: reason});
    }

    public banUser(id: number, reason: string, duration: number) {
        // this.sendCommand(Events.USER_BAN, {id: id, reason: reason, duration: duration});
    }

    public unbanUser(id: number) {
        // this.sendCommand(Events.USER_UNBAN, {id: id});
    }
}

export default Nart;
