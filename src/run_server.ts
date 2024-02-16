import websocket from 'ws';
// @ts-ignore
import BattleEyeClient from 'battle-eye-client';
import http, { RequestListener, ServerResponse } from "http";
import fs, { readlinkSync } from "fs";
import dgram from "dgram";
import Player from './Models/Player';
import ServerRepository from "./Repository/ServerRepository";
import Server from './Models/Server';
import { data } from 'jquery';
import Ban from './Models/Ban';
import ServerEvents from "./ServerEvents";
import { open } from 'openurl';
import { exec } from 'child_process';
import SettingsRepository from './Repository/SettingsRepository';
import Settings from './Models/Settings';
import VariableTimer from './VariableTimer';
import ConsoleColorsRepository from './Repository/ConsoleColorsRepository';
import PlayersRepository from './Repository/PlayersRepository';
import PlayerRecord from './Models/PlayerRecord';
import CacheRepository from './Repository/CacheRepository';

interface BattleEyeClient {
    socket: dgram.Socket;
    ip: string;
    port: number;
    password: string;
    messageHandler: CallableFunction;
    timeoutHandler: CallableFunction;
    sequenceNumber: null;
    loggedIn: null;
    lastResponse: null;
    lastCommand: null;
    error: null;
    interval: null;
    multipacket: null;

    constructor(ip: string, port: number, password: string): void;
    connect(): void;
    sendCommand(command: string): void;
    acknowledge(sequenceNumber: any): void;
    send(data: string): number|void;
    keepAlive(): void;
    login(): void;
    timeout(client: BattleEyeClient): void;
    close(): void;
    buildLoginPacket(): Buffer;
    stripHeader(message: string): Buffer;
    stripHeaderServerMessage(message: string): Buffer;
    stripHeaderMultipacket(message: string): Buffer;
}


class BattleEyeSocketRelay {
    public wss: websocket.Server;
    public rcon: BattleEyeClient | null = null;
    public cachedAuth: Server | null = null;
    public serverRepo: ServerRepository;
    public settingsRepo: SettingsRepository;
    public consoleColorRepo: ConsoleColorsRepository;
    public playersRepo: PlayersRepository;
    public cacheRepo: CacheRepository;
    private settings: Settings;
    // private runTimers = false;
    private playerTimer: VariableTimer;
    private banTimer: VariableTimer;
    private adminsTimer: VariableTimer;

    public constructor(wss: websocket.Server) {
        this.wss = wss;
        this.serverRepo       = new ServerRepository();
        this.settingsRepo     = new SettingsRepository();
        this.consoleColorRepo = new ConsoleColorsRepository();
        this.playersRepo      = new PlayersRepository();
        this.cacheRepo        = new CacheRepository();
        this.settings         = this.settingsRepo.get();

        this.playerTimer = new VariableTimer('players', () => {
            this.command("players");
        }, this.settings.get('players-refresh-interval') * 1000);

        this.banTimer = new VariableTimer('bans', () => {
            this.command("bans");
        }, this.settings.get('bans-refresh-interval') * 1000);

        this.adminsTimer = new VariableTimer('admins', () => {
            this.command("admins");
        }, this.settings.get('admins-refresh-interval') * 1000);
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

            socket.on('message', function (msg: websocket.RawData) {
                let message = JSON.parse(msg.toString());
                console.log(`${new Date().toLocaleTimeString()}: Received: ${msg.toString()}`);

                try {
                    if (message.type === ServerEvents.SETTINGS_LIST) {
                        relay.settings = relay.settingsRepo.get();
                        relay.socketSend({
                            id: message.id,
                            type: ServerEvents.SETTINGS_LIST,
                            data: relay.settings
                        });
                        return;
                    }

                    if (message.type === ServerEvents.SETTINGS_SAVE) {
                        let prev: Settings = Settings.fromJson(JSON.parse(JSON.stringify(relay.settings)));
                        let newSettings = Settings.fromJson(message.data.settings);
                        relay.settings = newSettings;

                        if (
                            newSettings.get('players-refresh-interval') !== prev.get('players-refresh-interval') ||
                            newSettings.get('bans-refresh-interval') !== prev.get('bans-refresh-interval') ||
                            newSettings.get('admins-refresh-interval') !== prev.get('admins-refresh-interval')
                        ) {
                            relay.startTimers();
                        }

                        relay.settingsRepo.upsert(newSettings);

                        relay.socketSend({
                            id: message.id,
                            type: ServerEvents.SETTINGS_SAVE,
                            data: true
                        });
                        return;
                    }

                    if (message.type === ServerEvents.COLORS_LIST) {
                        relay.socketSend({
                            id: message.id,
                            type: ServerEvents.COLORS_LIST,
                            data: relay.consoleColorRepo.all()
                        });
                        return;
                    }

                    if (message.type === ServerEvents.COLORS_SAVE) {
                        relay.consoleColorRepo.upsert(message.data);
                        relay.socketSend({
                            id: message.id,
                            type: ServerEvents.COLORS_SAVE,
                            data: true
                        });
                        relay.socketSend({
                            id: message.id,
                            type: ServerEvents.COLORS_LIST,
                            data: relay.consoleColorRepo.all()
                        });
                        return;
                    }

                    if (message.type === ServerEvents.SERVERS_LIST) {
                        relay.socketSend({
                            id: message.id,
                            type: ServerEvents.SERVERS_LIST,
                            data: relay.serverRepo.all()
                        });
                        return;
                    }

                    if (message.type === ServerEvents.SERVERS_SAVE) {
                        message.data.forEach((server: Server) => {
                            relay.serverRepo.upsert(server);
                        });

                        relay.socketSend({
                            id: message.id,
                            type: ServerEvents.SERVERS_SAVE,
                            data: true
                        });

                        relay.socketSend({
                            id: null,
                            type: ServerEvents.SERVERS_LIST,
                            data: relay.serverRepo.all()
                        });
                        return;
                    }

                    if (message.type === ServerEvents.SERVER_DELETE) {
                        relay.serverRepo.delete(message.data.id);
                        relay.socketSend({
                            id: message.id,
                            type: ServerEvents.SERVER_DELETE,
                            data: true
                        });
                        relay.socketSend({
                            id: null,
                            type: ServerEvents.SERVERS_LIST,
                            data: relay.serverRepo.all()
                        });
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

                    if (message.type === ServerEvents.PLAYERS) {
                        relay.command("players");
                        return;
                    }

                    if (message.type === ServerEvents.BANS) {
                        relay.command("bans");
                        return;
                    }

                    if (message.type === ServerEvents.ADMINS) {
                        relay.command("admins");
                        return;
                    }

                    if (message.type === ServerEvents.CHAT_ADMIN_MESSAGE) {
                        if (message.data?.message !== undefined && message.data.message.trim() !== '') {
                            relay.command(`say -1 ${message.data.message}`);
                        }
                        return;
                    }

                    if (message.type === ServerEvents.CHAT_PRIVATE_MESSAGE) {
                        if (message.data?.id === undefined || message.data.id < 0) {
                            console.log('ERR: Invalid ID');
                            return;
                        }

                        let playersCache = relay.cacheRepo.get('players');

                        if (playersCache === null) {
                            console.log('ERR: playersCache is NULL');
                            return;
                        }

                        console.log(playersCache);
                        let player: Player|null|undefined = playersCache.find((p: Player) => p.id === message.data.id);

                        if (player === undefined || player === null || player.id === null || player.id < 0) {
                            console.log('ERR: player not found');
                            return;
                        }

                        if (message.data?.message !== undefined && message.data.message.trim() !== '') {
                            relay.command(`say ${player.id} ${message.data.message}`);
                        } else {
                            console.log('ERR: No message data');
                        }
                        return;
                    }

                    if (message.type === ServerEvents.USER_BAN) {
                        return;
                    }

                    if (message.type === ServerEvents.USER_UNBAN) {
                        return;
                    }

                    if (message.type === ServerEvents.USER_KICK) {
                        if (message.data?.id === undefined || message.data.id < 0) {
                            return;
                        }

                        let playersCache = relay.cacheRepo.get('players');

                        if (playersCache === null) {
                            return;
                        }

                        let player: Player|null|undefined = playersCache.find((p: Player) => p.id === message.data.id);

                        if (player === undefined || player === null || player.id === null || player.id < 0) {
                            return;
                        }

                        relay.command(`kick ${player.id} ${message.data.reason ?? ''}`);
                        return;
                    }

                    if (message.type === ServerEvents.SET_COMMENT) {
                        relay.playersRepo.updateComment(message.data.id, message.data.comment);
                        return;
                    }

                    if (message.type === ServerEvents.SET_NICKNAME) {
                        relay.playersRepo.updateNickname(message.data.id, message.data.nickname);
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
                            relay.rcon?.close();
                            relay.stopTimers();
                            process.exit(0);
                        }
                    } catch (error) {
                        return;
                    }
                }, 15000);
            });
        });
    }

    public command(data: string) {
        if (this.rcon === null) return;

        console.log(`${new Date().toLocaleTimeString()}: RUNNING CMD ${data}`);

        try {
            this.rcon.sendCommand(data);
        } catch (error) {
            this.socketSend({
                type: ServerEvents.SOCK_ERROR,
                data: error
            });
        }

        // console.log(`${new Date().toLocaleTimeString()}: RUNNING CMD ${data}`);
    }

    public socketSend(data: object|string): void {
        // if data is string, convert to object
        if (typeof(data) === "string") {
            if (data.toString().trim() === '') {
                return;
            }

            data = {
                type: ServerEvents.MESSAGE,
                data: data
            };
        }

        console.log(`${new Date().toLocaleTimeString()}: RELAYING REPLY ${JSON.stringify(data)}`);

        this.wss.clients.forEach(function (websocket) {
            websocket.send(JSON.stringify(data));
        });
    }

    public parsePlayersData(message: string): Player[] {
        let playerData = message.trim().split('\n');
        playerData.shift();
        playerData.shift();
        playerData.shift();
        playerData.pop();

        let players = [];
        for (let i = 0; i < playerData.length; i++) {
            let status = playerData[i].includes('(Lobby)') ? "In Lobby" : "Alive";
            let player = playerData[i].replace('(Lobby)', '').replace(/\s+/g, ' ').trim().split(' ');

            players.push(new Player({
                id: parseInt(player[0]),
                ip: player[1],
                ping: player[2],
                guid: player[3].replace('(OK)', ''),
                name: player.slice(4).join(' '),
                status: status,
            }));
        }

        return players;
    }

    public parseBanData(message: string): Ban[] {
        let bans: Ban[] = [];
        let banData = message.trim()
            .replace('GUID Bans:', '')
            .replace('IP Bans:', '')
            .replace(/\[\#\].*/g, '')
            .replace(/\-{2,}/g, '')
            .replace(/\n+/, '\n')
            .trim()
            .split('\n');

        for (let i = 0; i < banData.length; i++) {
            if (banData[i].trim() === '') {
                continue;
            }

            let ban = banData[i].trim().split(/\s+/);
            let isIp = ban[1].split('.').length === 4;

            bans.push(Ban.fromJson({
                ip: isIp ? ban[1] : null,
                guid: isIp ? null : ban[1],
                minutesLeft: parseInt(ban[2]),
                reason: ban.slice(3).join(' ')
            }));
        }

        return bans;
    }

    public getBattleEyeClient(server: Server): void {
        this.rcon = new BattleEyeClient(server.address, server.port, server.password);
        this.cachedAuth = server;

        this.rcon?.connect();

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

            console.log(`INBOUND: ${message}`);

            if (message.match(/^Player .*? has been kicked by BattleEye/)) {
                let m = message.match(/^Player .*? \((.*?)\) has been kicked by BattleEye/) || [];

                let player = relay.playersRepo.findByGuid(m[1]);
                relay.socketSend({
                    type: ServerEvents.USER_KICK,
                    data: {
                        player: player,
                    }
                });
                return;
            }

            if (message.match(/^RCon admin \#\d+: \(To (.*?)\) (.*?)$/)) {
                // let m = message.match(/^RCon admin \#\d+: \(To (.*?)\) (.*?)$/) || [];
                relay.socketSend({
                    type: ServerEvents.CHAT_PRIVATE_MESSAGE,
                    data: message
                });
                return;
            }

            if (message.match(/\: \(Global\) (.*?) connected$/)) {
                return;
            }

            if (message.startsWith('(Global) ')) {
                // let m = message.match(/^\(Global\) (Survivor.*?): (.*)$/) || [];
                relay.socketSend({
                    type: ServerEvents.CHAT_GLOBAL_MESSAGE,
                    data: message
                });
                return;
            }

            if (message.match(/^RCon admin \#\d+: \(Global\) /)) {
                relay.socketSend({
                    type: ServerEvents.CHAT_ADMIN_MESSAGE,
                    data: message
                });
                return;
            }

            if (message.match(/^Player .*? connected$/) !== null) {
                let m: string[] = message.match(/^Player #(\d+) (.*?) \((\d+\.\d+\.\d+\.\d+:\d+)\) connected$/) || [];
                let id = parseInt(m[1]);
                let name: string = m[2];
                let ip: string = m[3].split(':')[0];

                relay.socketSend({
                    type: ServerEvents.CHAT_PLAYER_JOIN,
                    data: {
                        id: id,
                        ip: ip,
                        name: name,
                        message: message
                    }
                });
                return;
            }

            if (message.match(/^Player .*? disconnected$/) !== null) {
                let m: string[] = message.match(/^Player #(\d+) Survivor \((\d+\.\d+\.\d+\.\d+:\d+)\) disconnected$/) || [];

                let playerRecordCache = relay.cacheRepo.get('players');
                let player: Player|null = null;

                if (playerRecordCache !== null) {
                    player = playerRecordCache.find((p: Player) => p.id === parseInt(m[1]));

                    // remove from cache
                    relay.cacheRepo.set('players', playerRecordCache.filter((p: Player) => p.id !== parseInt(m[1])));
                }

                relay.socketSend({
                    type: ServerEvents.CHAT_PLAYER_LEAVE,
                    data: {
                        id: parseInt(m[1]),
                        ip: m[2],
                        player: player,
                        message: message
                    }
                });
                return;
            }

            if (message.includes('Players on server:')) {
                let players: Player[] = relay.parsePlayersData(message);

                players.map((player: Player) => {
                    let playerRecord = relay.playersRepo.findByGuid(player.guid);

                    if (playerRecord === null) {
                        playerRecord = PlayerRecord.fromPlayer(player);
                    } else {
                        playerRecord.lastSeen = relay.rcon?.ip ?? '';
                        playerRecord.lastSeenDate = new Date();
                    }

                    player.syncRecord(playerRecord);
                    relay.playersRepo.upsert(playerRecord);

                    return player;
                });

                let playerRecords = relay.playersRepo.all();

                relay.cacheRepo.set('players', players);

                relay.socketSend({
                    type: ServerEvents.PLAYERS,
                    data: {
                        players: players,
                        playerRecords: playerRecords
                    }
                })
                return;
            }

            if (message.includes('GUID Bans:')) {
                relay.socketSend({
                    type: ServerEvents.BANS,
                    data: relay.parseBanData(message)
                })
                return;
            }

            if (message.match(/^RCon admin \#\d+ \(.*?\) logged in$/) !== null) {
                // let m: string[] = message.match(/^RCon admin \#(\d+) \((.*?\)) logged in$/) || [];
                relay.socketSend({
                    type: ServerEvents.CHAT_ADMIN_JOIN,
                    data: message
                });
                return;
            }

            if (message.startsWith('Connected RCon admins:')) {
                let m = message.split('\n');
                m.shift();
                m.shift();
                m.shift();

                let admins = [];
                for (let i = 0; i < m.length; i++) {
                    let admin = m[i].trim().split(' ');
                    admins.push({
                        id: admin[0],
                        ip: admin[1].split(':')[0],
                        port: admin[1].split(':')[1]
                    });

                    relay.socketSend({
                        type: ServerEvents.ADMINS,
                        data: admins
                    });
                }
                return;
            }

            if (message.match(/^RCon admin \#\d+ \(.*?\) logged out$/) !== null) {
                let m: string[] = message.match(/^RCon admin \#(\d+) \((.*?)\) logged in$/) || [];
                relay.socketSend({
                    type: ServerEvents.CHAT_ADMIN_LEAVE,
                    data: message
                });
                return;
            }

            relay.socketSend(message);
        };

        // @ts-ignore
        this.rcon?.timeoutHandler = function () {
            relay.rcon = null;

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

