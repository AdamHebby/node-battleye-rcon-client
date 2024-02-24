import ServerEvents from "../../../ServerEvents";
import { RconSender } from "../../Sender";
import { InboundSocketMessage } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class AdminChatHandler extends WebSocketMessageHandler {
    public constructor(
        private rconSender: RconSender
    ) {
        super();
    }

    public handle(message: InboundSocketMessage): void {
        if (message.data?.message === undefined || message.data.message.trim() === '') {
            return;
        }

        this.rconSender.send(`say -1 ${message.data.message}`);
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.CHAT_ADMIN_MESSAGE;
    }
}

export default AdminChatHandler;
