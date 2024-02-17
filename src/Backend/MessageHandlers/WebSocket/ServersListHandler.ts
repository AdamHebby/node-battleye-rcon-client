import ServerRepository from "../../../Repository/ServerRepository";
import ServerEvents from "../../../ServerEvents";
import { SocketSender } from "../../Sender";
import { InboundSocketMessage, MessageSocketResponse } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class ServersListHandler extends WebSocketMessageHandler {
    public constructor(
        private serverRepository: ServerRepository,
        private socketSender: SocketSender
    ) {
        super();
    }

    public handle(message: InboundSocketMessage): void {
        this.socketSender.reply(message, {
            type: ServerEvents.SERVERS_LIST,
            data: this.serverRepository.all()
        } as MessageSocketResponse);
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.SERVERS_LIST;
    }
}

export default ServersListHandler;
