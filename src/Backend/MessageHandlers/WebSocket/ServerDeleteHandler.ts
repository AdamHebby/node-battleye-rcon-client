import { IServerRepository } from "../../../Repository/ServerRepository";
import ServerEvents from "../../../ServerEvents";
import { SocketSender } from "../../Sender";
import { InboundSocketMessage, MessageSocketResponse } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class ServerDeleteHandler extends WebSocketMessageHandler {
    public constructor(
        private serverRepo: IServerRepository,
        private socketSender: SocketSender
    ) {
        super();
    }

    public handle(message: InboundSocketMessage): void {
        if (message.data.id === undefined) {
            return;
        }

        this.serverRepo.delete(message.data.id);
        this.socketSender.reply(message, {
            type: ServerEvents.SERVER_DELETE,
            data: true
        } as MessageSocketResponse);

        this.socketSender.send({
            type: ServerEvents.SERVERS_LIST,
            data: this.serverRepo.all()
        } as MessageSocketResponse);
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.SERVER_DELETE;
    }
}

export default ServerDeleteHandler;
