import ServerEvents from "../../../ServerEvents";
import { InboundSocketMessage, MessageSocketResponse } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class PlayerUnbanHandler extends WebSocketMessageHandler {
    public constructor() {
        super();
    }

    public handle(message: InboundSocketMessage): void {

    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.USER_UNBAN;
    }
}

export default PlayerUnbanHandler;
