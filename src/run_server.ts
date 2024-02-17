import websocket from 'ws';
// @ts-ignore
import BattleEyeClient from 'battle-eye-client';
import http, { ServerResponse } from "http";
import fs from "fs";
import ServerRepository from "./Repository/ServerRepository";
import Server from './Models/Server';
import ServerEvents from "./ServerEvents";
import { open } from 'openurl';
import { exec } from 'child_process';
import SettingsRepository from './Repository/SettingsRepository';
import Settings from './Models/Settings';
import VariableTimer from './VariableTimer';
import PlayersRepository from './Repository/PlayersRepository';
import CacheRepository from './Repository/CacheRepository';
import BattleyeMessageHandlerManager from './Backend/MessageHandlers/Battleye/BattleyeMessageHandlerManager';
import { SocketSender, RconSender } from './Backend/Sender';
import { MessageSocketResponse } from './Backend/MessageHandlers/AbstractMessageHandler';
import WebSocketMessageHandlerManager from './Backend/MessageHandlers/WebSocket/WebSocketMessageHandlerManager';

class BattleEyeSocketRelay {
    public wss: websocket.Server;
    public rcon: BattleEyeClient | null = null;

    public socketSender: SocketSender;
    public rconSender: RconSender;

    public cachedAuth: Server | null = null;
    public serverRepo: ServerRepository;
    public settingsRepo: SettingsRepository;
    public playersRepo: PlayersRepository;
    public cacheRepo: CacheRepository;
    private settings: Settings;
    private playerTimer: VariableTimer;
    private banTimer: VariableTimer;
    private adminsTimer: VariableTimer;

    public constructor(wss: websocket.Server) {
        this.wss = wss;
        this.socketSender = new SocketSender(this.wss);
        this.rconSender   = new RconSender(this.rcon);
        this.serverRepo   = new ServerRepository();
        this.settingsRepo = new SettingsRepository();
        this.playersRepo  = new PlayersRepository();
        this.cacheRepo    = new CacheRepository();
        this.settings     = this.settingsRepo.get();

        this.playerTimer = new VariableTimer('players', () => {
            this.command("players");
        }, parseInt(this.settings.get('players-refresh-interval') ?? 5) * 1000);

        this.banTimer = new VariableTimer('bans', () => {
            this.command("bans");
        }, parseInt(this.settings.get('bans-refresh-interval') ?? 5) * 1000);

        this.adminsTimer = new VariableTimer('admins', () => {
            this.command("admins");
        }, parseInt(this.settings.get('admins-refresh-interval') ?? 5) * 1000);
    }

    public listenToWebsocket(): void
    {
        let relay = this;
        this.wss.on('connection', function (socket: websocket) {
            console.log(`${new Date().toLocaleTimeString()}: Connected to Nart`);

            if (relay.rcon !== null && relay.cachedAuth !== null) {
                relay.socketSend({
                    id: null,
                    type: ServerEvents.RCON_CONNECT,
                    data: {
                        id: relay.cachedAuth.id,
                    }
                });
            }

            let websocketMessageHandler = WebSocketMessageHandlerManager.factory(relay.socketSender, relay.rconSender);

            socket.on('message', function (msg: websocket.RawData) {
                let message = JSON.parse(msg.toString());

                try {
                    let handled = websocketMessageHandler.handleMessage(message);

                    if (message.type === ServerEvents.SETTINGS_SAVE) {
                        relay.settings = relay.settingsRepo.get();
                    }

                    console.log(`${new Date().toLocaleTimeString()}: ${message.type.toUpperCase()} HANDLED: ${handled}`);

                    if (handled) {
                        return;
                    }

                    if (message.type === ServerEvents.RCON_CONNECT) {
                        if (relay.rcon !== null) {
                            return;
                        }

                        let s = relay.serverRepo.find(message.data.id);

                        if (s === null) {
                            return;
                        }

                        relay.getBattleEyeClient(s);
                        relay.socketSend({
                            id: message.id,
                            type: ServerEvents.RCON_CONNECT,
                            data: {
                                id: relay.cachedAuth?.id,
                            }
                        });
                        return;
                    }

                    if (message.type === ServerEvents.RCON_DISCONNECT) {
                        relay.stopTimers();
                        relay.cachedAuth = null;
                        relay.rcon?.close();
                        relay.socketSend({
                            id: message.id,
                            type: ServerEvents.RCON_DISCONNECT,
                            data: true
                        });
                        return;
                    }

                } catch (error: Error | any) {
                    console.trace(`${new Date().toLocaleTimeString()}: ERROR: ${error}`);
                    relay.socketSend({
                        id: message.id,
                        type: ServerEvents.SOCK_ERROR,
                        data: error.toString()
                    });
                }
            });

            socket.on('close', function() {
                console.log(`${new Date().toLocaleTimeString()}: Disconnected from Nart`);
                setTimeout(() => {
                    try {
                        if (relay.wss.clients.size === 0) {
                            console.log(`${new Date().toLocaleTimeString()}: No clients, exiting...`);
                            relay.stopTimers();
                            relay.rcon?.close();
                            process.exit(0);
                        }
                    } catch (error) {
                        return;
                    }
                }, 60000);
            });
        });
    }

    public command(data: string) {
        if (!this.rconSender) {
            return;
        }

        try {
            this.rconSender.send(data);
        } catch (error) {
            this.socketSend({
                type: ServerEvents.SOCK_ERROR,
                data: error
            });
        }

        // console.log(`${new Date().toLocaleTimeString()}: RUNNING CMD ${data}`);
    }

    public socketSend(data: MessageSocketResponse|string): void {
        this.socketSender.send(data);
    }

    public getBattleEyeClient(server: Server): void {
        this.rcon = new BattleEyeClient(server.address, server.port, server.password, 5000);
        this.rconSender.updateRcon(this.rcon);
        this.cachedAuth = server;

        this.rcon?.connect();

        let BattleyeMessageHandler = BattleyeMessageHandlerManager.factory(
            this.wss,
            this.cacheRepo,
            this.playersRepo,
            this.rcon?.ip ?? this.cachedAuth.address
        );

        let relay = this;
        // @ts-ignore
        this.rcon?.messageHandler = function (message: string) {
            if (message === 'Login Failed') {
                relay.socketSend({
                    type: ServerEvents.CHAT_ERROR,
                    data: message
                });

                relay.stopTimers();
                relay.cachedAuth = null;
                relay.rcon?.close();
                relay.socketSend({
                    id: null,
                    type: ServerEvents.RCON_DISCONNECT,
                    data: true
                });
                return;
            }

            if (!BattleyeMessageHandler.handleMessage(message)) {
                relay.socketSend({
                    type: ServerEvents.MESSAGE,
                    data: message
                });
            }
        };

        // @ts-ignore
        this.rcon?.timeoutHandler = function () {
            relay.rcon = null;
            relay.rconSender.updateRcon(null);

            if (relay.cachedAuth !== null) {
                relay.getBattleEyeClient(relay.cachedAuth)
            }
        };

        this.startTimers();
    }

    public updateTimers(): void {
        this.playerTimer.setTime(this.settings.get('players-refresh-interval') * 1000);
        this.banTimer.setTime(this.settings.get('bans-refresh-interval') * 1000);
        this.adminsTimer.setTime(this.settings.get('admins-refresh-interval') * 1000);
    }

    public stopTimers(): void {
        this.playerTimer.stop();
        this.banTimer.stop();
        this.adminsTimer.stop();
    }

    public startTimers(): void {
        this.updateTimers();
        this.playerTimer.start();
        this.banTimer.start();
        this.adminsTimer.start();
    }
}

const wss = new websocket.Server({ port: 12639 });

const requestListener = function (req: Request, res: ServerResponse) {
    if (req.url.startsWith('/resources')) {
        if (fs.existsSync(__dirname + '/..' + req.url) === false) {
            res.writeHead(404);
            res.end();
            return;
        }

        let header: string = 'image/png';

        if (req.url.endsWith('.css')) header = 'text/css';
        if (req.url.endsWith('.js')) header = 'text/javascript';
        if (req.url.endsWith('.json')) header = 'application/json';
        if (req.url.endsWith('.html')) header = 'text/html';
        if (req.url.endsWith('.jpg')) header = 'image/jpg';
        if (req.url.endsWith('.png')) header = 'image/png';

        res.setHeader("Content-Type", header);
        res.writeHead(200);
        res.end(
            fs.readFileSync(__dirname + '/..' + req.url)
        );
        return;
    }

    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    res.end(
        fs.readFileSync(__dirname + "/index.html")
    );
};

const LOCAL_PORT = 3000;
const LOCAL_HOST = 'localhost';

// @ts-ignore
const server = http.createServer(requestListener);
server.listen(LOCAL_PORT, LOCAL_HOST, () => {
    console.log(`${new Date().toLocaleTimeString()}: Server is running on http://${LOCAL_HOST}:${LOCAL_PORT}`);
});

try {
    (new BattleEyeSocketRelay(wss)).listenToWebsocket();
} catch (error) {
    console.error(error)
}

if ('WSLENV' in process.env) {
    exec(`cmd.exe /C start http://${LOCAL_HOST}:${LOCAL_PORT}`);
} else {
    open(`http://${LOCAL_HOST}:${LOCAL_PORT}`);
}

