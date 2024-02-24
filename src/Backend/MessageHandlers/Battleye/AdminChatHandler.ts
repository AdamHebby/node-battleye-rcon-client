import ServerEvents from "../../../ServerEvents";
import { Message, MessageSocketResponse } from "../AbstractMessageHandler";
import BattleyeMessageHandler from "./BattleyeMessageHandler";

class AdminChatHandler extends BattleyeMessageHandler {
    public constructor() {
        super();
    }

    public handle(message: Message): MessageSocketResponse {
        return {
            type: ServerEvents.CHAT_ADMIN_MESSAGE,
            data: {
                message: message.content
            }
        };
    }

    public canHandle(message: Message): boolean {
        return message.content.match(/^RCon admin #\d+: \(Global\) /) !== null;
    }
}

export default AdminChatHandler;
