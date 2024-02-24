import websocket from 'ws';
import BattleEyeClient from 'battle-eye-client';
import ServerRepository, { IServerRepository } from "../Repository/ServerRepository";
import Server from '../Models/Server';
import ServerEvents from "../ServerEvents";
import SettingsRepository, { ISettingsRepository } from '../Repository/SettingsRepository';
import Settings from '../Models/Settings';
import VariableTimer from '../VariableTimer';
import PlayersRepository, { IPlayersRepository } from '../Repository/PlayersRepository';
import CacheRepository, { ICacheRepository } from '../Repository/CacheRepository';
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
    public serverRepo: IServerRepository;
    public settingsRepo: ISettingsRepository;
    public playersRepo: IPlayersRepository;
    public cacheRepo: ICacheRepository;
    private settings: Settings;
    private playerTimer: VariableTimer;
    private banTimer: VariableTimer;
    private adminsTimer: VariableTimer;

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
        }, (this.settings.getInt('players-refresh-interval') ?? 5) * 1000);

        this.banTimer = new VariableTimer('bans', () => {
            this.command("bans");
        }, (this.settings.getInt('bans-refresh-interval') ?? 5) * 1000);

        this.adminsTimer = new VariableTimer('admins', () => {
            this.command("admins");
        }, (this.settings.getInt('admins-refresh-interval') ?? 5) * 1000);
    }

    public listenToWebsocket(): void
    {
        if (this.rcon !== null && this.cachedAuth !== null) {
            this.socketSend({
                id: null,
                type: ServerEvents.RCON_CONNECT,
                data: {
                    id: this.cachedAuth.id,
                }
            });
        }

        let websocketMessageHandler = WebSocketMessageHandlerManager.factory(
            this.socketSender,
            this.rconSender,
            ConsoleColorsRepository.repo(this.user),
            this.cacheRepo,
            this.serverRepo,
            this.settingsRepo,
            this.playersRepo
        );

        this.wss.on('message', (msg: websocket.RawData) => {
            let message = JSON.parse(msg.toString());

            try {
                let handled = websocketMessageHandler.handleMessage(message);

                if (message.type === ServerEvents.SETTINGS_SAVE) {
                    this.settings = this.settingsRepo.get();
                }

                if (handled) {
                    return;
                }

                if (message.type === ServerEvents.RCON_CONNECT) {
                    if (this.rcon !== null) {
                        return;
                    }

                    let s = this.serverRepo.find(message.data.id);

                    if (s === null) {
                        return;
                    }

                    this.getBattleEyeClient(s);
                    this.socketSend({
                        id: message.id,
                        type: ServerEvents.RCON_CONNECT,
                        data: {
                            id: message.data.id,
                        }
                    });
                    return;
                }

                if (message.type === ServerEvents.RCON_DISCONNECT) {
                    this.stopTimers();
                    this.cachedAuth = null;
                    this.rcon?.close();
                    this.socketSend({
                        id: message.id,
                        type: ServerEvents.RCON_DISCONNECT,
                        data: true
                    });
                    this.stopTimers();
                    this.rcon?.close();
                    this.rcon = null;
                    return;
                }

            } catch (error: unknown) {
                this.logger.error(`ERROR: ${error}`);
                this.socketSend({
                    id: message.id,
                    type: ServerEvents.SOCK_ERROR,
                    data: String(error)
                });
            }
        });

        this.wss.on('close', () => {
            this.logger.info(`Disconnected from Nart`);
            this.cachedAuth = null;
            this.stopTimers();
            this.rcon?.close();
            this.rcon = null;
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

        if (this.rcon === null || this.rcon.messageHandler === null || this.rcon.timeoutHandler === null) {
            return;
        }

        this.rcon.messageHandler = (message: string) => {
            if (message === 'Login Failed') {
                this.socketSend({
                    type: ServerEvents.CHAT_ERROR,
                    data: message
                });

                this.stopTimers();
                this.cachedAuth = null;
                this.rcon?.close();
                this.socketSend({
                    id: null,
                    type: ServerEvents.RCON_DISCONNECT,
                    data: true
                });
                return;
            }

            if (!BattleyeMessageHandler.handleMessage(message)) {
                this.socketSend({
                    type: ServerEvents.MESSAGE,
                    data: message
                });
            }
        };

        this.rcon.timeoutHandler = () => {
            this.rcon = null;
            this.rconSender.updateRcon(null);

            if (this.cachedAuth !== null) {
                this.getBattleEyeClient(this.cachedAuth);
            }
        };

        this.startTimers();
    }

    public updateTimers(): void {
        this.playerTimer.setTime((this.settings.getInt('players-refresh-interval') ?? 5) * 1000);
        this.banTimer.setTime((this.settings.getInt('bans-refresh-interval') ?? 5) * 1000);
        this.adminsTimer.setTime((this.settings.getInt('admins-refresh-interval') ?? 5) * 1000);
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
