import ServerEvents from "../../../ServerEvents";
import { IRconSender } from "../../Sender";
import { InboundSocketMessage } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class ReloadScriptsHandler extends WebSocketMessageHandler {
    public constructor(
        private rconSender: IRconSender
    ) {
        super();
    }

    public handle(_: InboundSocketMessage): void {
        this.rconSender.send(`loadScripts`);
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.RCON_RELOAD_SCRIPTS;
    }
}

export default ReloadScriptsHandler;
