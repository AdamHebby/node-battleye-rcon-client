import Ban from "../../../Models/Ban";
import ServerEvents from "../../../ServerEvents";
import { Message, MessageSocketResponse } from "../AbstractMessageHandler";
import BattleyeMessageHandler from "./BattleyeMessageHandler";

class BansHandler extends BattleyeMessageHandler {
    public constructor() {
        super();
    }

    public handle(message: Message): MessageSocketResponse {
        return {
            type: ServerEvents.BANS,
            data: BansHandler.parseBanData(message.content)
        };
    }

    public canHandle(message: Message): boolean {
        return message.content.startsWith('GUID Bans:')
    }

    private static parseBanData(message: string): Ban[] {
        let bans: Ban[] = [];
        let banData = message.trim()
            .replace('GUID Bans:', '')
            .replace('IP Bans:', '')
            .replace(/\[\#\].*/g, '')
            .replace(/\-{2,}/g, '')
            .replace(/\n+/, '\n')
            .trim()
            .split('\n');

        for (let i = 0; i < banData.length; i++) {
            if (banData[i].trim() === '') {
                continue;
            }

            let ban = banData[i].trim().split(/\s+/);
            let isIp = ban[1].split('.').length === 4;

            let minutesLeft: number = parseInt(ban[2]);

            bans.push(Ban.fromJson({
                id: parseInt(ban[0]),
                ip: isIp ? ban[1] : null,
                guid: isIp ? null : ban[1],
                minutesLeft: isNaN(minutesLeft) ? -1 : minutesLeft,
                reason: ban.slice(3).join(' ')
            }));
        }

        return bans;
    }
}

export default BansHandler;
