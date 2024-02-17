import Player from "../../../Models/Player";
import PlayerRecord from "../../../Models/PlayerRecord";
import CacheRepository from "../../../Repository/CacheRepository";
import PlayersRepository from "../../../Repository/PlayersRepository";
import ServerEvents from "../../../ServerEvents";
import { Message, MessageSocketResponse } from "../AbstractMessageHandler";
import BattleyeMessageHandler from "./BattleyeMessageHandler";

class PlayerConnectHandler extends BattleyeMessageHandler {
    public constructor(
        private cacheRepo: CacheRepository,
        private playerRepo: PlayersRepository
    ) {
        super();
    }

    public handle(message: Message): MessageSocketResponse {
        let m: string[];
        let ip: string;
        let player: Player | PlayerRecord | undefined | null;

        if (message.content.startsWith('Player #') && message.content.endsWith('connected')) {
            // actually really unlikely to find
            m = message.content.match(/^Player #(\d+) (.*?) \((\d+\.\d+\.\d+\.\d+):\d+\) connected$/) || [];
            ip = m[3];
            player = this.playerRepo.findByIpWithoutPort(ip);

            console.debug(player);
        }

        if (message.content.startsWith('Verified GUID')) {
            m = message.content.match(/^Verified GUID \((.*?)\) of player #(\d+) (.*)$/) || [];
            player = this.playerRepo.findByGuid(m[1]);
        }

        if (message.content.includes(' - BE GUID')) {
            m = message.content.match(/BE GUID: (.*?)$/) || [];
            player = this.playerRepo.findByGuid(m[1]);
        }

        return {
            type: ServerEvents.CHAT_PLAYER_JOIN,
            data: {
                player: player,
                message: message.content
            }
        };
    }

    public canHandle(message: Message): boolean {
        return message.content.match(/^Player .*? connected$/) !== null
            || message.content.match(/^Verified GUID \((.*?)\) of player #(\d+) .*?$/) !== null
            || message.content.match(/^Player #(\d+) .*? - BE GUID: .*?$/) !== null;
    }
}

export default PlayerConnectHandler;
