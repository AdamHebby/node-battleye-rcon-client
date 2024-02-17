import Player from "../../../Models/Player";
import PlayerRecord from "../../../Models/PlayerRecord";
import CacheRepository from "../../../Repository/CacheRepository";
import PlayersRepository from "../../../Repository/PlayersRepository";
import ServerEvents from "../../../ServerEvents";
import { Message, MessageSocketResponse } from "../AbstractMessageHandler";
import BattleyeMessageHandler from "./BattleyeMessageHandler";

class PlayerDisconnectHandler extends BattleyeMessageHandler {
    cacheRepo: CacheRepository;
    playersRepo: PlayersRepository;

    public constructor(
        cacheRepo: CacheRepository,
        playersRepo: PlayersRepository
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
            let pCache = this.cacheRepo.get('players');

            if (player !== null && pCache !== null) {
                // @ts-ignore Wont accept that I already check that player is not null
                this.cacheRepo.set('players', pCache.filter((p: Player) => p.guid !== player.guid));
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
