import ServerEvents from "../../../ServerEvents";
import { IRconSender } from "../../Sender";
import { InboundSocketMessage } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class CustomCommandHandler extends WebSocketMessageHandler {
    public constructor(
        private rconSender: IRconSender
    ) {
        super();
    }

    public handle(message: InboundSocketMessage): void {
        if (message.data.command === undefined || message.data.command.trim() === '') {
            return;
        }

        this.rconSender.send(message.data.command);
        return;
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.CUSTOM;
    }
}

export default CustomCommandHandler;
