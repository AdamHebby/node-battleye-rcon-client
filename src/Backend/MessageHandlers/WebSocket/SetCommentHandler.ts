import { IPlayersRepository } from "../../../Repository/PlayersRepository";
import ServerEvents from "../../../ServerEvents";
import { InboundSocketMessage, MessageSocketResponse } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class SetCommentHandler extends WebSocketMessageHandler {
    public constructor(
        private playersRepo: IPlayersRepository
    ) {
        super();
    }

    public handle(message: InboundSocketMessage): void {
        if (message.data.id === undefined || message.data.comment === undefined) {
            return;
        }

        this.playersRepo.updateComment(message.data.id, message.data.comment);
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.SET_COMMENT;
    }
}

export default SetCommentHandler;
