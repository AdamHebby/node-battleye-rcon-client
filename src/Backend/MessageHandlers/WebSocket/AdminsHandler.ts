import ServerEvents from "../../../ServerEvents";
import { RconSender } from "../../Sender";
import { InboundSocketMessage } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class AdminsHandler extends WebSocketMessageHandler {
    public constructor(
        private rconSender: RconSender
    ) {
        super();
    }

    public handle(): void {
        this.rconSender.send("admins");
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.ADMINS;
    }
}

export default AdminsHandler;
