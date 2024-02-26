import ServerEvents from "../../../ServerEvents";
import { IRconSender } from "../../Sender";
import { InboundSocketMessage } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class ReloadBansHandler extends WebSocketMessageHandler {
    public constructor(
        private rconSender: IRconSender
    ) {
        super();
    }

    public handle(_: InboundSocketMessage): void {
        this.rconSender.send(`loadBans`);
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.RCON_RELOAD_BANS;
    }
}

export default ReloadBansHandler;
