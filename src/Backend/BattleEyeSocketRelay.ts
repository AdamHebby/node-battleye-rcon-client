import websocket from 'ws';
import BattleEyeClient from 'battle-eye-client';
import ServerRepository from "../Repository/ServerRepository";
import Server from '../Models/Server';
import ServerEvents from "../ServerEvents";
import SettingsRepository from '../Repository/SettingsRepository';
import Settings from '../Models/Settings';
import VariableTimer from '../VariableTimer';
import PlayersRepository from '../Repository/PlayersRepository';
import CacheRepository from '../Repository/CacheRepository';
import BattleyeMessageHandlerManager from '../Backend/MessageHandlers/Battleye/BattleyeMessageHandlerManager';
import { SocketSender, RconSender } from '../Backend/Sender';
import { MessageSocketResponse } from '../Backend/MessageHandlers/AbstractMessageHandler';
import WebSocketMessageHandlerManager from '../Backend/MessageHandlers/WebSocket/WebSocketMessageHandlerManager';
import { NartSession } from '../Models/Session';
import NartRepository from '../Repository/NartRepository';
import ConsoleColorsRepository from '../Repository/ConsoleColorsRepository';
import { NartUser } from '../Models/NartUser';
import winston from 'winston';
import { Logger } from '../Logger';

class BattleEyeSocketRelay {
    public wss: websocket;
    public rcon: BattleEyeClient | null = null;

    public socketSender: SocketSender;
    public rconSender: RconSender;

    public cachedAuth: Server | null = null;
    public serverRepo: ServerRepository;
    public settingsRepo: SettingsRepository;
    public playersRepo: IPlayersRepository;
    public cacheRepo: CacheRepository;
    private settings: Settings;
    private playerTimer: VariableTimer;
    private banTimer: VariableTimer;
    private adminsTimer: VariableTimer;
    private lastMessageDate: Date = new Date();

    private user: NartUser;
    private logger: winston.Logger;

    public constructor(wss: websocket, session: NartSession|null) {
        this.logger       = Logger.normalLogger('relay.log');
        let nartUserRepo  = NartRepository.repo();
        let user          = nartUserRepo.getUserById(session?.userId ?? 0);

        if (user === null) {
            throw new Error('User not found');
        }

        this.user         = user;
        this.wss          = wss;
        this.socketSender = new SocketSender(this.wss);
        this.rconSender   = new RconSender(this.rcon);
        this.serverRepo   = ServerRepository.repo(this.user);
        this.settingsRepo = SettingsRepository.repo(this.user);
        this.playersRepo  = PlayersRepository.repo(this.user);
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
        if (relay.rcon !== null && relay.cachedAuth !== null) {
            relay.socketSend({
                id: null,
                type: ServerEvents.RCON_CONNECT,
                data: {
                    id: relay.cachedAuth.id,
                }
            });
        }

        let websocketMessageHandler = WebSocketMessageHandlerManager.factory(
            relay.socketSender,
            relay.rconSender,
            ConsoleColorsRepository.repo(this.user),
            relay.cacheRepo,
            relay.serverRepo,
            relay.settingsRepo,
            relay.playersRepo
        );

        this.wss.on('message', function (msg: websocket.RawData) {
            relay.lastMessageDate = new Date();
            let message = JSON.parse(msg.toString());

            try {
                let handled = websocketMessageHandler.handleMessage(message);

                if (message.type === ServerEvents.SETTINGS_SAVE) {
                    relay.settings = relay.settingsRepo.get();
                }

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
                            id: message.data.id,
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
                    relay.stopTimers();
                    relay.rcon?.close();
                    relay.rcon = null;
                    return;
                }

            } catch (error: Error | any) {
                relay.logger.error(`ERROR: ${error}`);
                relay.socketSend({
                    id: message.id,
                    type: ServerEvents.SOCK_ERROR,
                    data: error.toString()
                });
            }
        });

        this.wss.on('close', function() {
            relay.logger.info(`Disconnected from Nart`);
            relay.cachedAuth = null;
            relay.stopTimers();
            relay.rcon?.close();
            relay.rcon = null;
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

export default BattleEyeSocketRelay;
