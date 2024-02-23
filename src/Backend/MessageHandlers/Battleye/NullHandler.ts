import { Message, MessageSocketResponse } from "../AbstractMessageHandler";
import BattleyeMessageHandler from "./BattleyeMessageHandler";

class NullHandler extends BattleyeMessageHandler {
    public constructor() {
        super();
    }

    public handle(message: Message): null {
        return null;
    }

    public canHandle(message: Message): boolean {
        return message.content.trim() === '';
    }
}

export default NullHandler;
