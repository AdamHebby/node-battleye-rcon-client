import ServerEvents from "../../../ServerEvents";
import { InboundSocketMessage, MessageSocketResponse } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class PlayerDeleteHandler extends WebSocketMessageHandler {
    public constructor() {
        super();
    }

    public handle(message: InboundSocketMessage): void {

    }

    public canHandle(message: InboundSocketMessage): boolean {
        return false;
        // return message.type === ServerEvents.PLAYER_BAN;
    }
}

export default PlayerDeleteHandler;
