import ServerEvents from "../../../ServerEvents";
import { InboundSocketMessage } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class PlayerDeleteHandler extends WebSocketMessageHandler {
    public constructor() {
        super();
    }

    public handle(message: InboundSocketMessage): void {
        console.debug(message);
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.PLAYER_DELETE;
    }
}

export default PlayerDeleteHandler;
