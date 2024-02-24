import ServerEvents from "../../../ServerEvents";
import { RconSender } from "../../Sender";
import { InboundSocketMessage } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class BansHandler extends WebSocketMessageHandler {
    public constructor(
        private rconSender: RconSender
    ) {
        super();
    }

    public handle(): void {
        this.rconSender.send("bans");
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.BANS;
    }
}

export default BansHandler;
