import { IRconSender, RconSender, SocketSender } from "../../Sender";
import { InboundSocketMessage } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";
import AdminChatHandler from "./AdminChatHandler";
import AdminsHandler from "./AdminsHandler";
import BansHandler from "./BansHandler";
import ColorsListHandler from "./ColorsListHandler";
import ColorsSaveHandler from "./ColorsSaveHandler";
import CustomCommandHandler from "./CustomCommandHandler";
import PlayerBanHandler from "./PlayerBanHandler";
import PlayerDeleteHandler from "./PlayerDeleteHandler";
import PlayerKickHandler from "./PlayerKickHandler";
import PlayerUnbanHandler from "./PlayerUnbanHandler";
import PlayersHandler from "./PlayersHandler";
import PrivateMessageHandler from "./PrivateMessageHandler";
import ServerDeleteHandler from "./ServerDeleteHandler";
import ServersListHandler from "./ServersListHandler";
import ServersSaveHandler from "./ServersSaveHandler";
import SetCommentHandler from "./SetCommentHandler";
import SetNicknameHandler from "./SetNicknameHandler";
import SettingsListHandler from "./SettingsListHandler";
import SettingsSaveHandler from "./SettingsSaveHandler";
import { IConsoleColorsRepository } from "../../../Repository/ConsoleColorsRepository";
import { ICacheRepository } from "../../../Repository/CacheRepository";
import { IServerRepository } from "../../../Repository/ServerRepository";
import { ISettingsRepository } from "../../../Repository/SettingsRepository";
import { IPlayersRepository } from "../../../Repository/PlayersRepository";

class WebSocketMessageHandlerManager {
    private messageHandlers: WebSocketMessageHandler[] = [];

    public addMessageHandler(messageHandler: WebSocketMessageHandler) {
        this.messageHandlers.push(messageHandler);
    }

    public handleMessage(message: InboundSocketMessage): boolean {
        for (let i = 0; i < this.messageHandlers.length; i++) {
            if (this.messageHandlers[i].canHandle(message)) {
                this.messageHandlers[i].handle(message);
                return true;
            }
        }

        return false;
    }

    public static factory(
        socket: SocketSender,
        rcon: IRconSender,
        consoleColorRepository: IConsoleColorsRepository,
        cacheRepository: ICacheRepository,
        serverRepository: IServerRepository,
        settingsRepository: ISettingsRepository,
        playersRepository: IPlayersRepository,
    ): WebSocketMessageHandlerManager {
        let factory = new WebSocketMessageHandlerManager();

        factory.addMessageHandler(new AdminChatHandler(rcon));
        factory.addMessageHandler(new AdminsHandler(rcon));
        factory.addMessageHandler(new BansHandler(rcon));
        factory.addMessageHandler(new ColorsListHandler(consoleColorRepository, socket));
        factory.addMessageHandler(new ColorsSaveHandler(consoleColorRepository, socket));
        factory.addMessageHandler(new CustomCommandHandler(rcon));
        factory.addMessageHandler(new PlayerBanHandler(playersRepository, rcon));
        factory.addMessageHandler(new PlayerDeleteHandler());
        factory.addMessageHandler(new PlayerKickHandler(cacheRepository, rcon, socket));
        factory.addMessageHandler(new PlayerUnbanHandler(rcon));
        factory.addMessageHandler(new PlayersHandler(rcon));
        factory.addMessageHandler(new PrivateMessageHandler(cacheRepository, rcon, socket));
        factory.addMessageHandler(new ServerDeleteHandler(serverRepository, socket));
        factory.addMessageHandler(new ServersListHandler(serverRepository, socket));
        factory.addMessageHandler(new ServersSaveHandler(serverRepository, socket));
        factory.addMessageHandler(new SetCommentHandler(playersRepository));
        factory.addMessageHandler(new SetNicknameHandler(playersRepository));
        factory.addMessageHandler(new SettingsListHandler(settingsRepository, socket));
        factory.addMessageHandler(new SettingsSaveHandler(settingsRepository, socket));

        return factory;
    }
}

export default WebSocketMessageHandlerManager;