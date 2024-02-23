import { WebSocket } from "ws";
import BattleyeMessageHandlerManager from "../../../../../src/Backend/MessageHandlers/Battleye/BattleyeMessageHandlerManager";
import NullHandler from "../../../../../src/Backend/MessageHandlers/Battleye/NullHandler";
import GlobalChatHandler from "../../../../../src/Backend/MessageHandlers/Battleye/GlobalChatHandler";
import CacheRepository from "../../../../../src/Repository/CacheRepository";

jest.mock('ws');

describe("BattleyeMessageHandlerManager", () => {
    it("Should handle the message with the correct handler", () => {
        let ws = new WebSocket('');
        ws.send = jest.fn();
        let messageHandler = new BattleyeMessageHandlerManager(ws);

        messageHandler.addMessageHandler(new NullHandler());
        messageHandler.addMessageHandler(new GlobalChatHandler(new CacheRepository()));

        expect(messageHandler.handleMessage('')).toBe(true);
        expect(messageHandler.handleMessage('Its gonna be false')).toBe(false);
        expect(messageHandler.handleMessage('(Global) Some Survivor Name 871: Hello, world!')).toBe(true);

    });
});
