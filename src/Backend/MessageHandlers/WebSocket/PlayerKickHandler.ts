import Player from "../../../Models/Player";
import CacheRepository from "../../../Repository/CacheRepository";
import ServerEvents from "../../../ServerEvents";
import { RconSender, SocketSender } from "../../Sender";
import { InboundSocketMessage, MessageSocketResponse } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class PlayerKickHandler extends WebSocketMessageHandler {
    public constructor(
        private cacheRepository: CacheRepository,
        private rconSender: RconSender,
        private socketSender: SocketSender
    ) {
        super();
    }

    public handle(message: InboundSocketMessage): void {
        if (message.data?.id === undefined || message.data.id < 0) {
            return;
        }

        let playersCache = this.cacheRepository.get('players');

        if (playersCache === null) {
            return;
        }

        let player: Player|null|undefined = playersCache.find((p: Player) => p.id === message.data.id);

        if (player === undefined || player === null || player.id === null || player.id < 0) {
            this.socketSender.reply(message, {
                type: ServerEvents.SOCK_ERROR,
                data: {
                    id: message.data.id,
                    message: 'Player not found'
                }
            } as MessageSocketResponse);
            return;
        }

        this.rconSender.send(`kick ${player.id} ${message.data.reason ?? ''}`);
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.USER_KICK;
    }
}

export default PlayerKickHandler;
