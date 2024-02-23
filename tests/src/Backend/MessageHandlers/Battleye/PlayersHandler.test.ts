import PlayersHandler from "../../../../../src/Backend/MessageHandlers/Battleye/PlayersHandler";
import CacheRepository from "../../../../../src/Repository/CacheRepository";
import ServerEvents from "../../../../../src/ServerEvents";
import PlayerRecord from "../../../../../src/Models/PlayerRecord";
import { existsSync, rmSync } from "fs";
import PlayersRepositoryMock from "../../../Mocks/PlayersRepositoryMock";
import Player from "../../../../../src/Models/Player";

let playersRepo = new PlayersRepositoryMock();

interface PartialRecord {
    id: number;
    ip: string;
    ping: number;
    guid: string;
    name: string;
    status: string;
}

function getPlayersOnServer(records: PartialRecord[]): string {
    let playersOnServer =
        'Players on server:\n' +
        '[#] [IP Address]:[Port] [Ping] [GUID] [Name]\n' +
        '--------------------------------------------------\n';

    records.forEach(player => {
        playersOnServer += player.id.toString().padEnd(4) +
            player.ip.padEnd(22) +
            player.ping.toString().padEnd(5) +
            `${player.guid}(OK)`.padEnd(37) +
            player.name + player.status + '\n';
    });

    playersOnServer += `(${records.length} players in total)`;

    return playersOnServer;
}

function getPlayerRecords(records: PartialRecord[]): PlayerRecord[] {
    return records.map(player => new PlayerRecord({
        id: player.id,
        lastIp: player.ip,
        guid: player.guid,
        name: player.name,
        nickname: '',
        comment: '',
        lastSeen: player.ip,
        lastSeenDate: new Date()
    }));
}

describe("PlayersHandler", () => {
    it("should handle players list message", () => {
        let playerData: PartialRecord[] = [
            {id: 0, ip: '192.168.255.1:2387',    ping: 100, guid: 'x'.repeat(30) + '00', name: 'Player 0',  status: ''},
            {id: 3, ip: '192.168.255.3:2304',    ping: 103, guid: 'x'.repeat(30) + '03', name: 'Player 3',  status: ''},
            {id: 5, ip: '192.168.255.5:8723',    ping: 105, guid: 'x'.repeat(30) + '05', name: 'Player 5',  status: '(Lobby)'},
            {id: 7, ip: '192.168.255.7:65000',   ping: 107, guid: 'x'.repeat(30) + '07', name: 'Player 7',  status: '(Lobby)'},
            {id: 8, ip: '192.168.255.8:40123',   ping: 108, guid: 'x'.repeat(30) + '08', name: 'Player 8',  status: ''},
            {id: 10, ip: '192.168.255.10:12222', ping: 110, guid: 'x'.repeat(30) + '10', name: 'Player 10', status: ''},
        ];

        let playersOnServer = getPlayersOnServer(playerData);
        let playerCount     = playerData.length;
        let playerRecords   = getPlayerRecords(playerData);
        playersRepo.data    = playerRecords;

        const message = {
            content: playersOnServer
        };

        let cacheRepo = new CacheRepository();
        const playerConnectHandler = new PlayersHandler(cacheRepo, playersRepo, '192.168.0.1');

        const canHandle = playerConnectHandler.canHandle(message);
        const response = playerConnectHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response.type).toEqual(ServerEvents.PLAYERS);
        expect(response.data.playerRecords).toEqual(playersRepo.all());

        let players: Player[] = response.data.players;

        players.forEach((player: Player) => {
            expect(player).toBeInstanceOf(Player);
            expect(player.id).toBeGreaterThan(-1);
            expect(player.ip).toMatch(/192\.168\.255\.\d+:\d+/);
            expect(player.ping).toBeGreaterThan(99);
            expect(player.ping).toBeLessThan(501);
            expect(player.guid).toMatch(/x{30}\d{2}/);
            expect(player.name).toMatch(/Player \d+/);
        });

        let repoGuids = playersRepo.all().map((player: PlayerRecord) => player.guid).sort();
        let playerGuids = players.map((player: Player) => player.guid).sort();

        expect(repoGuids).toEqual(playerGuids);
        expect(players.length).toBe(playerCount);
    });


    it("should handle players list message, adding and updating records when needed", () => {
        let serverPlayerData: PartialRecord[] = [
            {id: 0, ip: '192.168.255.1:2387',    ping: 100, guid: 'x'.repeat(30) + '00', name: 'Player 0',  status: ''},
            {id: 3, ip: '192.168.255.3:2304',    ping: 103, guid: 'x'.repeat(30) + '03', name: 'Player 3',  status: ''},
            {id: 5, ip: '192.168.255.5:8723',    ping: 105, guid: 'x'.repeat(30) + '05', name: 'Player 5',  status: '(Lobby)'},
            {id: 7, ip: '192.168.255.7:65000',   ping: 107, guid: 'x'.repeat(30) + '07', name: 'Player 7',  status: '(Lobby)'},
            {id: 8, ip: '192.168.255.8:40123',   ping: 108, guid: 'x'.repeat(30) + '08', name: 'Player 8',  status: ''},
            {id: 10, ip: '192.168.255.10:12222', ping: 110, guid: 'x'.repeat(30) + '10', name: 'Player 10', status: ''},
        ];

        let repoPlayerData: PartialRecord[] = [
            {id: 0, ip: '192.168.255.1:2387',    ping: 100, guid: 'x'.repeat(30) + '00', name: 'Unknown',  status: ''},
            {id: 3, ip: '192.168.255.3:2304',    ping: 103, guid: 'x'.repeat(30) + '03', name: 'Unknown',  status: ''},
            {id: 8, ip: '192.168.255.8:40123',   ping: 108, guid: 'x'.repeat(30) + '08', name: 'Unknown',  status: ''},
            {id: 10, ip: '192.168.255.10:12222', ping: 110, guid: 'x'.repeat(30) + '10', name: 'Unknown', status: ''},
        ];

        let playersOnServer = getPlayersOnServer(serverPlayerData);
        let playerRecords   = getPlayerRecords(repoPlayerData);
        playersRepo.data    = playerRecords;

        const message = {
            content: playersOnServer
        };

        let cacheRepo = new CacheRepository();
        const playerConnectHandler = new PlayersHandler(cacheRepo, playersRepo, '192.168.0.1');

        const canHandle = playerConnectHandler.canHandle(message);
        const response = playerConnectHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response.type).toEqual(ServerEvents.PLAYERS);
        expect(response.data.playerRecords).toEqual(playersRepo.all());

        let players: Player[] = response.data.players;

        players.forEach((player: Player) => {
            expect(player).toBeInstanceOf(Player);
            expect(player.id).toBeGreaterThan(-1);
            expect(player.ip).toMatch(/192\.168\.255\.\d+:\d+/);
            expect(player.ping).toBeGreaterThan(99);
            expect(player.ping).toBeLessThan(501);
            expect(player.guid).toMatch(/x{30}\d{2}/);
            expect(player.name).toMatch(/Player \d+/);

            let inRepo = playersRepo.containsGuid(player.guid);
            expect(inRepo).toBe(true);
        });


        let repoGuids   = playersRepo.all().map((player: PlayerRecord) => player.guid).sort();
        let playerGuids = players.map((player: Player) => player.guid).sort();

        expect(repoGuids).toEqual(playerGuids);
    });

});
