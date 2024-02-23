import { IPlayersRepository } from "../../../Repository/PlayersRepository";
import ServerEvents from "../../../ServerEvents";
import { Message, MessageSocketResponse } from "../AbstractMessageHandler";
import BattleyeMessageHandler from "./BattleyeMessageHandler";

class PlayerKickedHandler extends BattleyeMessageHandler {
    playersRepo: IPlayersRepository;
    public constructor(
        playersRepo: IPlayersRepository
    ) {
        super();
        this.playersRepo = playersRepo;
    }

    public handle(message: Message): MessageSocketResponse {
        let m = message.content.match(/^Player .*? \((.*?)\) has been kicked by BattlEye/) || [];
        let player = this.playersRepo.findByGuid(m[1]);

        return {
            type: ServerEvents.USER_KICK,
            data: {
                message: message.content,
                player: player,
            }
        };
    }

    public canHandle(message: Message): boolean {
        return message.content.match(/^Player .*? has been kicked by BattlEye/) !== null;
    }
}

export default PlayerKickedHandler;
