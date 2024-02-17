import ServerEvents from "../../../ServerEvents";
import { RconSender } from "../../Sender";
import { InboundSocketMessage, MessageSocketResponse } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class BansHandler extends WebSocketMessageHandler {
    public constructor(
        private rconSender: RconSender
    ) {
        super();
    }

    public handle(message: InboundSocketMessage): void {
        this.rconSender.send("bans");
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.BANS;
    }
}

export default BansHandler;
