import { IPlayersRepository } from "../../../Repository/PlayersRepository";
import ServerEvents from "../../../ServerEvents";
import { IRconSender } from "../../Sender";
import { InboundSocketMessage } from "../AbstractMessageHandler";
import WebSocketMessageHandler from "./WebSocketMessageHandler";

class PlayerBanHandler extends WebSocketMessageHandler {
    public constructor(
        private playersRepo: IPlayersRepository,
        private rconSender: IRconSender,
    ) {
        super();
    }

    public handle(message: InboundSocketMessage): void {
        if (message.data?.guid === undefined || message.data.guid < 0) {
            return;
        }

        let player = this.playersRepo.findByGuid(message.data.guid);

        if (player === null) {
            return;
        }

        let duration = parseInt(message.data.duration);
        let reason = message.data.reason ?? '';

        if (message.data.source.banGuid === true) {
            this.banByGuid(player.guid, duration, reason);
        }

        if (message.data.source.banIp === true) {
            this.banByIp(player.lastIp, duration, reason);
        }

        if (message.data.source.banPreviousIps === true) {
            for (let ip of player.previousIps) {
                this.banByIp(ip, duration, reason);
            }
        }
    }

    private banByGuid(guid: string, duration: number, reason: string): void {
        this.rconSender.send(`addBan ${guid} ${duration} ${reason}`);
    }

    private banByIp(ip: string, duration: number, reason: string): void {
        ip = ip.split(':')[0];
        this.rconSender.send(`addBan ${ip} ${duration} ${reason}`);
    }

    public canHandle(message: InboundSocketMessage): boolean {
        return message.type === ServerEvents.USER_BAN;
    }
}

export default PlayerBanHandler;
