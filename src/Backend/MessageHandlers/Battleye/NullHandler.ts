import { Message } from "../AbstractMessageHandler";
import BattleyeMessageHandler from "./BattleyeMessageHandler";

class NullHandler extends BattleyeMessageHandler {
    public constructor() {
        super();
    }

    public handle(_: Message): null {
        return null;
    }

    public canHandle(message: Message): boolean {
        return message.content.trim() === '';
    }
}

export default NullHandler;
