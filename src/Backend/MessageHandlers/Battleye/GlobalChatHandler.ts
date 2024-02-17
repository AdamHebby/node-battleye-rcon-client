import CacheRepository from "../../../Repository/CacheRepository";
import ServerEvents from "../../../ServerEvents";
import { Message, MessageSocketResponse } from "../AbstractMessageHandler";
import BattleyeMessageHandler from "./BattleyeMessageHandler";

class GlobalChatHandler extends BattleyeMessageHandler {
    cacheRepo: CacheRepository;
    public constructor(
        cacheRepo: CacheRepository
    ) {
        super();
        this.cacheRepo = cacheRepo;
    }

    public handle(message: Message): MessageSocketResponse {
        let m = message.content.match(/^\(Global\) (.*?)\: (.*)$/) || [];
        let username = m[1];
        let player = this.cacheRepo.get('players')?.find((p: any) => p.name === username);

        return {
            type: ServerEvents.CHAT_GLOBAL_MESSAGE,
            data: {
                message: message.content,
                player: player
            }
        };
    }

    public canHandle(message: Message): boolean {
        return message.content.startsWith('(Global) ');
    }
}

export default GlobalChatHandler;
