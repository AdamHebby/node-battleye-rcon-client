import Database from "better-sqlite3-multiple-ciphers";
import PlayerKickedHandler from "../../../../../src/Backend/MessageHandlers/Battleye/PlayerKickedHandler";
import CacheRepository from "../../../../../src/Repository/CacheRepository";
import ServerEvents from "../../../../../src/ServerEvents";
import PlayerRecord from "../../../../../src/Models/PlayerRecord";
import { existsSync, rmSync } from "fs";
import PlayersRepositoryMock from "../../../Mocks/PlayersRepositoryMock";


describe("PlayerKickedHandler", () => {
    it("should handle survivor connected messages by Verified GUID", () => {
        let playersRepo = new PlayersRepositoryMock();

        let playerRecord: PlayerRecord|null = new PlayerRecord({
            id: 1,
            lastIp: '127.0.0.1:2304',
            guid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            name: 'name',
            nickname: 'nickname',
            comment: 'comment',
            lastSeen: '127.0.0.1:2304',
            lastSeenDate: new Date(),
        });

        playersRepo.data = [playerRecord];

        const message = {
            content: "Player Survivor (aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa) has been kicked by BattlEye (Testing)"
        };
        const playerKickedHandler = new PlayerKickedHandler(playersRepo);

        const canHandle = playerKickedHandler.canHandle(message);
        const response = playerKickedHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response).toEqual({
            type: ServerEvents.USER_KICK,
            data: {
                message: "Player Survivor (aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa) has been kicked by BattlEye (Testing)",
                player: playerRecord
            }
        });
    });

    it("should handle survivor connected messages by Verified GUID even when no player found", () => {
        let playersRepo = new PlayersRepositoryMock();

        const message = {
            content: "Player Survivor (aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa) has been kicked by BattlEye (Testing)"
        };

        const playerKickedHandler = new PlayerKickedHandler(playersRepo);

        const canHandle = playerKickedHandler.canHandle(message);
        const response = playerKickedHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response).toEqual({
            type: ServerEvents.USER_KICK,
            data: {
                message: "Player Survivor (aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa) has been kicked by BattlEye (Testing)",
                player: null
            }
        });
    });


    it("should not handle non-admin connect messages", () => {
        let playersRepo = new PlayersRepositoryMock();
        const playerKickedHandler = new PlayerKickedHandler(playersRepo);

        expect(playerKickedHandler.canHandle({
            content: "RCon admin #14 (192.168.0.1) logged out"
        })).toBe(false);

        expect(playerKickedHandler.canHandle({
            content: "(Global) Survivor: Hello, world!"
        })).toBe(false);

        expect(playerKickedHandler.canHandle({
            content: "(Global) Survivor: RCon admin #14 (192.168.0.1) logged in"
        })).toBe(false);

        expect(playerKickedHandler.canHandle({
            content: "RCon admin #1: (Global) RCon admin #14 (192.168.0.1) logged in"
        })).toBe(false);
    });
});
