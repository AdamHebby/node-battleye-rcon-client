import { AbstractMessageHandler, InboundSocketMessage, MessageSocketResponse } from "../AbstractMessageHandler";

abstract class WebSocketMessageHandler extends AbstractMessageHandler {
    public abstract handle(message: InboundSocketMessage): MessageSocketResponse | null | void;

    public abstract canHandle(message: InboundSocketMessage): boolean;
}

export default WebSocketMessageHandler;
