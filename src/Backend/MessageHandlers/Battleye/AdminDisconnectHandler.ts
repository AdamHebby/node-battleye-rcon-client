import ServerEvents from "../../../ServerEvents";
import { Message, MessageSocketResponse } from "../AbstractMessageHandler";
import BattleyeMessageHandler from "./BattleyeMessageHandler";

class AdminDisconnectHandler extends BattleyeMessageHandler {
    public constructor() {
        super();
    }

    public handle(message: Message): MessageSocketResponse {
        return {
            type: ServerEvents.CHAT_ADMIN_LEAVE,
            data: {
                message: message.content
            }
        };
    }

    public canHandle(message: Message): boolean {
        return message.content.match(/^RCon admin #\d+ \(.*?\) logged out$/) !== null;
    }
}

export default AdminDisconnectHandler;
