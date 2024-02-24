import Player from "../../../Models/Player";
import { ICacheRepository } from "../../../Repository/CacheRepository";
import ServerEvents from "../../../ServerEvents";
import { Message, MessageSocketResponse } from "../AbstractMessageHandler";
import BattleyeMessageHandler from "./BattleyeMessageHandler";

class PrivateMessageHandler extends BattleyeMessageHandler {
    cacheRepo: ICacheRepository;
    public constructor(
        cacheRepo: ICacheRepository
    ) {
        super();
        this.cacheRepo = cacheRepo;
    }

    public handle(message: Message): MessageSocketResponse {
        let m = message.content.match(/^RCon admin #\d+: \(To (.*?)\) (.*?)$/) || [];
        let playersCache = this.cacheRepo.get('players');
        let player: Player|null = null;

        if (playersCache !== null && playersCache !== undefined && Array.isArray(playersCache) && playersCache.length > 0) {
            player = playersCache.find((p: Player) => p.name === m[1]);
        }

        return {
            type: ServerEvents.CHAT_PRIVATE_MESSAGE,
            data: {
                message: message.content,
                player: player
            }
        };
    }

    public canHandle(message: Message): boolean {
        return message.content.match(/^RCon admin #\d+: \(To (.*?)\) (.*?)$/) !== null;
    }
}

export default PrivateMessageHandler;
