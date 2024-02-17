import { AbstractMessageHandler, Message, MessageSocketResponse } from "../AbstractMessageHandler";

abstract class BattleyeMessageHandler extends AbstractMessageHandler {
    public abstract handle(message: Message): MessageSocketResponse | null | void;

    public abstract canHandle(message: Message): boolean;
}

export default BattleyeMessageHandler;
