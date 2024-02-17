import Server from "../../../Models/Server";
import ServerRepository from "../../../Repository/ServerRepository";
import ServerEvents from "../../../ServerEvents";
import { SocketSender } from "../../Sender";
import { InboundSocketMessage, MessageSocketResponse } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class ServersSaveHandler extends WebSocketMessageHandler {
    public constructor(
        private serverRepo: ServerRepository,
        private socketSender: SocketSender
    ) {
        super();
    }

    public handle(message: InboundSocketMessage): void {
        if (message.data === undefined || !Array.isArray(message.data) || message.data.length === 0) {
            return;
        }

        message.data.forEach((server: Server) => {
            this.serverRepo.upsert(server);
        });

        this.socketSender.reply(message, {
            type: ServerEvents.SERVERS_SAVE,
            data: true
        } as MessageSocketResponse);

        this.socketSender.send({
            type: ServerEvents.SERVERS_LIST,
            data: this.serverRepo.all()
        } as MessageSocketResponse);
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.SERVERS_SAVE;
    }
}

export default ServersSaveHandler;
