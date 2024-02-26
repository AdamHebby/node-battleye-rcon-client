import ServerEvents from "../../../ServerEvents";
import { IRconSender } from "../../Sender";
import { InboundSocketMessage } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class AdminChatHandler extends WebSocketMessageHandler {
    public constructor(
        private rconSender: IRconSender
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
