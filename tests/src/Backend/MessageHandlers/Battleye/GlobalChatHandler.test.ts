import GlobalChatHandler from "../../../../../src/Backend/MessageHandlers/Battleye/GlobalChatHandler";
import Player from "../../../../../src/Models/Player";
import CacheRepository from "../../../../../src/Repository/CacheRepository";
import ServerEvents from "../../../../../src/ServerEvents";

describe("GlobalChatHandler", () => {
    it("should handle global chat messages", () => {
        const message = {
            content: "(Global) Survivor: Hello, world!"
        };

        let cacheRepo = new CacheRepository();

        const globalChatHandler = new GlobalChatHandler(cacheRepo);
        const canHandle = globalChatHandler.canHandle(message);
        const response = globalChatHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response).toEqual({
            type: ServerEvents.CHAT_GLOBAL_MESSAGE,
            data: {
                message: "(Global) Survivor: Hello, world!",
                player: null
            }
        });
    });

    it("should handle global chat messages and populate player object when known", () => {
        const message = {
            content: "(Global) Some Survivor Name 871: Hello, world!"
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

        const globalChatHandler = new GlobalChatHandler(cacheRepo);
        const canHandle = globalChatHandler.canHandle(message);
        const response = globalChatHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response).toEqual({
            type: ServerEvents.CHAT_GLOBAL_MESSAGE,
            data: {
                message: "(Global) Some Survivor Name 871: Hello, world!",
                player: player
            }
        });
    });


    it("should not handle non-global chat messages", () => {
        const globalChatHandler = new GlobalChatHandler(new CacheRepository());
        expect(globalChatHandler.canHandle({
            content: "RCon admin #1: (Global) Hello, world!"
        })).toBe(false);
    });
});