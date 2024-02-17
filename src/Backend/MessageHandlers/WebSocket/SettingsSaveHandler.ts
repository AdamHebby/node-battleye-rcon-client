import Settings from "../../../Models/Settings";
import SettingsRepository from "../../../Repository/SettingsRepository";
import ServerEvents from "../../../ServerEvents";
import { SocketSender } from "../../Sender";
import { InboundSocketMessage, MessageSocketResponse } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class SettingsSaveHandler extends WebSocketMessageHandler {
    public constructor(
        private settingsRepo: SettingsRepository,
        private socketSender: SocketSender
    ) {
        super();
    }

    public handle(message: InboundSocketMessage): void {
        if (
            message.data === undefined
            || message.data.settings === undefined
            || !Array.isArray(message.data.settings)
            || message.data.settings.length === 0
        ) {
            return;
        }

        let newSettings = Settings.fromJson(message.data.settings);
        this.settingsRepo.upsert(newSettings);

        this.socketSender.reply(message, {
            type: ServerEvents.SETTINGS_SAVE,
            data: true
        } as MessageSocketResponse);
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.SETTINGS_SAVE;
    }
}

export default SettingsSaveHandler;
