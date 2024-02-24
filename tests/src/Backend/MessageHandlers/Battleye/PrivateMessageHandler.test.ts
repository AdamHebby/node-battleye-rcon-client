import PrivateMessageHandler from "../../../../../src/Backend/MessageHandlers/Battleye/PrivateMessageHandler";
import Player from "../../../../../src/Models/Player";
import CacheRepository from "../../../../../src/Repository/CacheRepository";
import ServerEvents from "../../../../../src/ServerEvents";

describe("PrivateMessageHandler", () => {
    it("should handle admin private chat messages", () => {
        const message = {
            content: "RCon admin #0: (To Survivor Nart) Message goes here"
        };

        const adminChatHandler = new PrivateMessageHandler(new CacheRepository());
        const canHandle = adminChatHandler.canHandle(message);
        const response = adminChatHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response).toEqual({
            type: ServerEvents.CHAT_PRIVATE_MESSAGE,
            data: {
                message: "RCon admin #0: (To Survivor Nart) Message goes here",
                player: null
            }
        });
    });

    it("should handle admin private chat messages with a player", () => {
        const message = {
            content: "RCon admin #0: (To Some Survivor Name 871) Message goes here"
        };

        let player = new Player({
            id: 1,
            dbId: 1,
            ip: '192.168.0.1',
            ping: 71,
            guid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            name: 'Some Survivor Name 871',
            status: 'Alive',
        });

        let cacheRepo = new CacheRepository();
        cacheRepo.set('players', [player]);

        const adminChatHandler = new PrivateMessageHandler(cacheRepo);
        const canHandle = adminChatHandler.canHandle(message);
        const response = adminChatHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response).toEqual({
            type: ServerEvents.CHAT_PRIVATE_MESSAGE,
            data: {
                message: "RCon admin #0: (To Some Survivor Name 871) Message goes here",
                player: player
            }
        });
    });


    it("should not handle non-admin chat messages", () => {
        const adminChatHandler = new PrivateMessageHandler(new CacheRepository());
        expect(adminChatHandler.canHandle({
            content: "(Global) Survivor: Hello, world!"
        })).toBe(false);
    });
});