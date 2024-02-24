import Player from "../../../Models/Player";
import PlayerRecord from "../../../Models/PlayerRecord";
import { ICacheRepository } from "../../../Repository/CacheRepository";
import { IPlayersRepository } from "../../../Repository/PlayersRepository";
import ServerEvents from "../../../ServerEvents";
import { Message, MessageSocketResponse } from "../AbstractMessageHandler";
import BattleyeMessageHandler from "./BattleyeMessageHandler";

class PlayerDisconnectHandler extends BattleyeMessageHandler {
    cacheRepo: ICacheRepository;
    playersRepo: IPlayersRepository;

    public constructor(
        cacheRepo: ICacheRepository,
        playersRepo: IPlayersRepository
    ) {
        super();
        this.cacheRepo = cacheRepo;
        this.playersRepo = playersRepo;
    }

    public handle(message: Message): MessageSocketResponse {
        let m: string[] = message.content.match(/^Player #(\d+) (.*?) disconnected$/) || [];

        let player: PlayerRecord | null = null;
        let name = m[2];

        player = this.playersRepo.findRecentByName(name);

        if (player !== null && player.guid !== null) {
            let pCache = this.cacheRepo.get('players') as Player[]|null|undefined;

            if (player !== null && pCache !== null && pCache !== undefined && pCache.length > 0) {
                this.cacheRepo.set('players', pCache.filter(
                    (p: Player) => player !== null && p.guid !== player.guid)
                );
            }
        }

        return {
            type: ServerEvents.CHAT_PLAYER_LEAVE,
            data: {
                player: player,
                message: message.content
            }
        };
    }

    public canHandle(message: Message): boolean {
        return message.content.match(/^Player .*? disconnected$/) !== null;
    }
}

export default PlayerDisconnectHandler;
