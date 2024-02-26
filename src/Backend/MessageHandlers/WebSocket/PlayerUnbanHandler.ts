import ServerEvents from "../../../ServerEvents";
import { IRconSender } from "../../Sender";
import { InboundSocketMessage } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class PlayerUnbanHandler extends WebSocketMessageHandler {
    public constructor(
        private rconSender: IRconSender,
    ) {
        super();
    }

    public handle(message: InboundSocketMessage): void {
        if (message.data?.id === undefined || message.data.id < 0) {
            return;
        }

        this.rconSender.send(`removeBan ${message.data.id}`);
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.USER_UNBAN;
    }
}

export default PlayerUnbanHandler;
