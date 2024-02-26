import ServerEvents from "../../../ServerEvents";
import { IRconSender } from "../../Sender";
import { InboundSocketMessage } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class BansHandler extends WebSocketMessageHandler {
    public constructor(
        private rconSender: IRconSender
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
