import PlayerDisconnectHandler from "../../../../../src/Backend/MessageHandlers/Battleye/PlayerDisconnectHandler";
import CacheRepository from "../../../../../src/Repository/CacheRepository";
import ServerEvents from "../../../../../src/ServerEvents";
import PlayerRecord from "../../../../../src/Models/PlayerRecord";
import PlayersRepositoryMock from "../../../Mocks/PlayersRepositoryMock";

describe("PlayerDisconnectHandler", () => {
    it("should handle survivor connected messages", () => {
        let playerRecord: PlayerRecord|null = new PlayerRecord({
            id: 1,
            lastIp: '127.0.0.1:2304',
            guid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            name: 'Survivor',
            nickname: 'nickname',
            comment: 'comment',
            lastSeen: '127.0.0.1:2304',
            lastSeenDate: new Date(),
        });

        let playersRepo = new PlayersRepositoryMock();
        playersRepo.data = [playerRecord];

        const message = {
            content: "Player #0 Survivor disconnected"
        };

        let cacheRepo = new CacheRepository();
        const playerConnectHandler = new PlayerDisconnectHandler(cacheRepo, playersRepo);

        const canHandle = playerConnectHandler.canHandle(message);
        const response = playerConnectHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response).toEqual({
            type: ServerEvents.CHAT_PLAYER_LEAVE,
            data: {
                message: "Player #0 Survivor disconnected",
                player: playerRecord
            }
        });
    });

    it("should handle survivor connected messages even when no player found", () => {
        let playersRepo = new PlayersRepositoryMock();

        const message = {
            content: "Player #0 Survivor disconnected"
        };

        let cacheRepo = new CacheRepository();
        const playerConnectHandler = new PlayerDisconnectHandler(cacheRepo, playersRepo);

        const canHandle = playerConnectHandler.canHandle(message);
        const response = playerConnectHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response).toEqual({
            type: ServerEvents.CHAT_PLAYER_LEAVE,
            data: {
                message: "Player #0 Survivor disconnected",
                player: null
            }
        });
    });

    it("should not handle non-admin connect messages", () => {
        let playersRepo = new PlayersRepositoryMock();
        const playerConnectHandler = new PlayerDisconnectHandler(new CacheRepository(), playersRepo);

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
