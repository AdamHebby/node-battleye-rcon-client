import { IPlayersRepository } from "../../../Repository/PlayersRepository";
import ServerEvents from "../../../ServerEvents";
import { InboundSocketMessage, MessageSocketResponse } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class SetNicknameHandler extends WebSocketMessageHandler {
    public constructor(
        private playersRepo: IPlayersRepository
    ) {
        super();
    }

    public handle(message: InboundSocketMessage): void {
        if (message.data.id === undefined || message.data.nickname === undefined) {
            return;
        }

        this.playersRepo.updateNickname(message.data.id, message.data.nickname);
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.SET_NICKNAME;
    }
}

export default SetNicknameHandler;
