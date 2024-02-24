import ServerEvents from "../../../ServerEvents";
import { RconSender } from "../../Sender";
import { InboundSocketMessage } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class PlayersHandler extends WebSocketMessageHandler {
    public constructor(
        private rconSender: RconSender
    ) {
        super();
    }

    public handle(): void {
        this.rconSender.send("players");
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.PLAYERS;
    }
}

export default PlayersHandler;
