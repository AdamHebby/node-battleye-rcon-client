import PlayerConnectHandler from "../../../../../src/Backend/MessageHandlers/Battleye/PlayerConnectHandler";
import CacheRepository from "../../../../../src/Repository/CacheRepository";
import ServerEvents from "../../../../../src/ServerEvents";
import PlayerRecord from "../../../../../src/Models/PlayerRecord";
    import PlayersRepositoryMock from "../../../Mocks/PlayersRepositoryMock";

let playersRepo = new PlayersRepositoryMock();

let playerRecord: PlayerRecord= new PlayerRecord({
    id: 1,
    lastIp: '127.0.0.1:2304',
    guid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    name: 'name',
    nickname: 'nickname',
    comment: 'comment',
    lastSeen: '127.0.0.1:2304',
    lastSeenDate: new Date(),
});


describe("PlayerConnectHandler", () => {
    it("should handle survivor connected messages", () => {
        playersRepo.data = [playerRecord];
        const message = {
            content: "Player #0 Survivor (127.0.0.1:2304) connected"
        };

        let cacheRepo = new CacheRepository();
        const playerConnectHandler = new PlayerConnectHandler(cacheRepo, playersRepo);

        const canHandle = playerConnectHandler.canHandle(message);
        const response = playerConnectHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response).toEqual({
            type: ServerEvents.CHAT_PLAYER_JOIN,
            data: {
                message: "Player #0 Survivor (127.0.0.1:2304) connected",
                player: playerRecord
            }
        });
    });

    it("should handle survivor connected messages by BE GUID", () => {
        playersRepo.data = [playerRecord];
        const message = {
            content: "Player #0 Survivor - BE GUID: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        };

        let cacheRepo = new CacheRepository();
        const playerConnectHandler = new PlayerConnectHandler(cacheRepo, playersRepo);

        const canHandle = playerConnectHandler.canHandle(message);
        const response = playerConnectHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response).toEqual({
            type: ServerEvents.CHAT_PLAYER_JOIN,
            data: {
                message: "Player #0 Survivor - BE GUID: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                player: playerRecord
            }
        });
    });

    it("should handle survivor connected messages by Verified GUID", () => {
        playersRepo.data = [playerRecord];
        const message = {
            content: "Verified GUID (aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa) of player #0 Survivor"
        };

        let cacheRepo = new CacheRepository();
        const playerConnectHandler = new PlayerConnectHandler(cacheRepo, playersRepo);

        const canHandle = playerConnectHandler.canHandle(message);
        const response = playerConnectHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response).toEqual({
            type: ServerEvents.CHAT_PLAYER_JOIN,
            data: {
                message: "Verified GUID (aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa) of player #0 Survivor",
                player: playerRecord
            }
        });
    });

    it("should handle survivor connected messages even when no player found", () => {
        playersRepo.truncate();

        const message = {
            content: "Player #0 Survivor (192.168.0.0.123:2304) connected"
        };

        let cacheRepo = new CacheRepository();
        const playerConnectHandler = new PlayerConnectHandler(cacheRepo, playersRepo);

        const canHandle = playerConnectHandler.canHandle(message);
        const response = playerConnectHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response).toEqual({
            type: ServerEvents.CHAT_PLAYER_JOIN,
            data: {
                message: "Player #0 Survivor (192.168.0.0.123:2304) connected",
                player: null
            }
        });
    });

    it("should handle survivor connected messages by BE GUID even when no player found", () => {
        const message = {
            content: "Player #0 Survivor - BE GUID: bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
        };

        const playerConnectHandler = new PlayerConnectHandler(new CacheRepository(), new PlayersRepositoryMock());

        const canHandle = playerConnectHandler.canHandle(message);
        const response = playerConnectHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response).toEqual({
            type: ServerEvents.CHAT_PLAYER_JOIN,
            data: {
                message: "Player #0 Survivor - BE GUID: bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                player: null
            }
        });
    });

    it("should handle survivor connected messages by Verified GUID even when no player found", () => {
        const message = {
            content: "Verified GUID (bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb) of player #0 Survivor"
        };

        const playerConnectHandler = new PlayerConnectHandler(new CacheRepository(), new PlayersRepositoryMock());

        const canHandle = playerConnectHandler.canHandle(message);
        const response = playerConnectHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response).toEqual({
            type: ServerEvents.CHAT_PLAYER_JOIN,
            data: {
                message: "Verified GUID (bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb) of player #0 Survivor",
                player: null
            }
        });
    });


    it("should not handle non-admin connect messages", () => {
        const playerConnectHandler = new PlayerConnectHandler(new CacheRepository(), playersRepo);

        expect(playerConnectHandler.canHandle({
            content: "RCon admin #14 (192.168.0.1) logged out"
        })).toBe(false);

        expect(playerConnectHandler.canHandle({
            content: "(Global) Survivor: Hello, world!"
        })).toBe(false);

        expect(playerConnectHandler.canHandle({
            content: "(Global) Survivor: RCon admin #14 (192.168.0.1) logged in"
        })).toBe(false);

        expect(playerConnectHandler.canHandle({
            content: "RCon admin #1: (Global) RCon admin #14 (192.168.0.1) logged in"
        })).toBe(false);
    });
});
