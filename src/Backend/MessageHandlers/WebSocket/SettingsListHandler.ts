import SettingsRepository from "../../../Repository/SettingsRepository";
import ServerEvents from "../../../ServerEvents";
import { SocketSender } from "../../Sender";
import { InboundSocketMessage, MessageSocketResponse } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class SettingsListHandler extends WebSocketMessageHandler {
    public constructor(
        private settingsRepo: SettingsRepository,
        private socketSender: SocketSender
    ) {
        super();
    }

    public handle(message: InboundSocketMessage): void {
        this.socketSender.reply(message, {
            type: ServerEvents.SETTINGS_LIST,
            data: this.settingsRepo.get()
        } as MessageSocketResponse);
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.SETTINGS_LIST;
    }
}

export default SettingsListHandler;
