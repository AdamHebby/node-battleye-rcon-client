import websocket from 'ws';
import { Message } from "../AbstractMessageHandler";
import BattleyeMessageHandler from "./BattleyeMessageHandler";
import PlayerDisconnectHandler from './PlayerDisconnectHandler';
import { IPlayersRepository } from '../../../Repository/PlayersRepository';
import { ICacheRepository } from '../../../Repository/CacheRepository';
import PlayersHandler from './PlayersHandler';
import AdminsHandler from './AdminsHandler';
import BansHandler from './BansHandler';
import PlayerKickedHandler from './PlayerKickedHandler';
import AdminChatHandler from './AdminChatHandler';
import AdminConnectHandler from './AdminConnectHandler';
import AdminDisconnectHandler from './AdminDisconnectHandler';
import GlobalChatHandler from './GlobalChatHandler';
import PlayerConnectHandler from './PlayerConnectHandler';
import PrivateMessageHandler from './PrivateMessageHandler';
import NullHandler from './NullHandler';

class BattleyeMessageHandlerManager {
    private messageHandlers: BattleyeMessageHandler[];
    private socket: websocket;

    public constructor(
        socket: websocket
    ) {
        this.messageHandlers = [];
        this.socket = socket;
    }

    public addMessageHandler(messageHandler: BattleyeMessageHandler) {
        this.messageHandlers.push(messageHandler);
    }

    public handleMessage(message: Message|string): boolean {
        if (typeof message === "string") {
            message = { content: message };
        }

        message.content = message.content.trim();

        for (let i = 0; i < this.messageHandlers.length; i++) {
            if (this.messageHandlers[i].canHandle(message)) {
                let response = this.messageHandlers[i].handle(message);

                if (response === null || response === undefined) {
                    return true;
                }

                this.socket.send(JSON.stringify(response));

                return true;
            }
        }

        return false;
    }

    public static factory(
        socket: websocket,
        cacheRepo: ICacheRepository,
        playerRepo: IPlayersRepository,
        serverIp: string
    ): BattleyeMessageHandlerManager {
        let factory = new BattleyeMessageHandlerManager(socket);

        factory.addMessageHandler(new AdminChatHandler());
        factory.addMessageHandler(new AdminConnectHandler());
        factory.addMessageHandler(new AdminDisconnectHandler());
        factory.addMessageHandler(new AdminsHandler());
        factory.addMessageHandler(new BansHandler());
        factory.addMessageHandler(new GlobalChatHandler(cacheRepo));
        factory.addMessageHandler(new PlayerConnectHandler(cacheRepo, playerRepo));
        factory.addMessageHandler(new PlayerDisconnectHandler(cacheRepo, playerRepo));
        factory.addMessageHandler(new PlayerKickedHandler(playerRepo));
        factory.addMessageHandler(new PlayersHandler(cacheRepo, playerRepo, serverIp));
        factory.addMessageHandler(new PrivateMessageHandler(cacheRepo));

        factory.addMessageHandler(new NullHandler());

        return factory;
    }
}

export default BattleyeMessageHandlerManager;