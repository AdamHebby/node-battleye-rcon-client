import ServerEvents from "../../ServerEvents";

interface Message {
    content: string;
}

interface InboundSocketMessage {
    id?: string | null;
    type: ServerEvents;
    data: any;
}

interface MessageHandler {
    handle(message: Message): MessageSocketResponse | null | void;
    canHandle(message: Message): boolean;
}

interface MessageSocketResponse {
    id?: string | null;
    type: ServerEvents;
    data: any;
}

abstract class AbstractMessageHandler implements MessageHandler {

    public abstract handle(message: Message|InboundSocketMessage): MessageSocketResponse | null | void;

    public abstract canHandle(message: Message|InboundSocketMessage): boolean;
}

export { InboundSocketMessage, AbstractMessageHandler, MessageHandler, Message, MessageSocketResponse };