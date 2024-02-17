import ConsoleColorsRepository from "../../../Repository/ConsoleColorsRepository";
import ServerEvents from "../../../ServerEvents";
import { SocketSender } from "../../Sender";
import { InboundSocketMessage, MessageSocketResponse } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class ColorsListHandler extends WebSocketMessageHandler {
    public constructor(
        private colorRepository: ConsoleColorsRepository,
        private socketSender: SocketSender
    ) {
        super();
    }

    public handle(message: InboundSocketMessage): void {
        this.socketSender.reply(message, {
            type: ServerEvents.COLORS_LIST,
            data:  this.colorRepository.all()
        } as MessageSocketResponse);
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.COLORS_LIST;
    }
}

export default ColorsListHandler;
