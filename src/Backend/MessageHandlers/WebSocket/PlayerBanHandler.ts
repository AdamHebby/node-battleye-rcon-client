import ServerEvents from "../../../ServerEvents";
import { InboundSocketMessage } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class PlayerBanHandler extends WebSocketMessageHandler {
    public constructor() {
        super();
    }

    public handle(message: InboundSocketMessage): void {
        console.debug(message);
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.USER_BAN;
    }
}

export default PlayerBanHandler;
