import Player from "../../../Models/Player";
import { ICacheRepository } from "../../../Repository/CacheRepository";
import ServerEvents from "../../../ServerEvents";
import { Message, MessageSocketResponse } from "../AbstractMessageHandler";
import BattleyeMessageHandler from "./BattleyeMessageHandler";

class GlobalChatHandler extends BattleyeMessageHandler {
    cacheRepo: ICacheRepository;
    public constructor(
        cacheRepo: ICacheRepository
    ) {
        super();
        this.cacheRepo = cacheRepo;
    }

    public handle(message: Message): MessageSocketResponse {
        let m = message.content.match(/^\(Global\) (.*?): (.*)$/) || [];
        let username = m[1];

        let playersCache = this.cacheRepo.get('players');
        let player: Player|null = null;

        if (playersCache !== null && playersCache !== undefined && Array.isArray(playersCache) && playersCache.length > 0) {
            player = playersCache.find((p: Player) => p.name === username);
        }

        return {
            type: ServerEvents.CHAT_GLOBAL_MESSAGE,
            data: {
                message: message.content,
                player: player !== undefined ? player : null
            }
        };
    }

    public canHandle(message: Message): boolean {
        return message.content.startsWith('(Global) ');
    }
}

export default GlobalChatHandler;
