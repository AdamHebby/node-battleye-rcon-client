import { IConsoleColorsRepository } from "../../../Repository/ConsoleColorsRepository";
import ServerEvents from "../../../ServerEvents";
import { SocketSender } from "../../Sender";
import { InboundSocketMessage } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class ColorsSaveHandler extends WebSocketMessageHandler {
    public constructor(
        private colorRepository: IConsoleColorsRepository,
        private socketSender: SocketSender
    ) {
        super();
    }

    public handle(message: InboundSocketMessage): void {
        if (message.data === undefined || !Array.isArray(message.data) || message.data.length === 0) {
            return;
        }

        this.colorRepository.upsert(message.data);
        this.socketSender.reply(message, {
            type: ServerEvents.COLORS_SAVE,
            data: true
        });

        this.socketSender.send({
            type: ServerEvents.COLORS_LIST,
            data: this.colorRepository.all()
        });
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.COLORS_SAVE;
    }
}

export default ColorsSaveHandler;
