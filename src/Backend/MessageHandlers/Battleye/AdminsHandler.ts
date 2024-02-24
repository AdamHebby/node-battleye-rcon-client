import ServerEvents from "../../../ServerEvents";
import { Message, MessageSocketResponse } from "../AbstractMessageHandler";
import BattleyeMessageHandler from "./BattleyeMessageHandler";

class AdminsHandler extends BattleyeMessageHandler {
    public constructor() {
        super();
    }

    public handle(message: Message): MessageSocketResponse {
        let m = message.content.split('\n');
        m.shift();
        m.shift();
        m.shift();

        let admins = [];
        for (let i = 0; i < m.length; i++) {
            let admin = m[i].trim().split(' ');
            admins.push({
                id: admin[0],
                ip: admin[1].split(':')[0],
                port: admin[1].split(':')[1]
            });
        }

        return {
            type: ServerEvents.ADMINS,
            data: admins
        };
    }

    public canHandle(message: Message): boolean {
        return message.content.startsWith('Connected RCon admins:');
    }
}

export default AdminsHandler;
