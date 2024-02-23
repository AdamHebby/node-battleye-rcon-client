import Player from "../../../Models/Player";
import PlayerRecord from "../../../Models/PlayerRecord";
import CacheRepository from "../../../Repository/CacheRepository";
import { IPlayersRepository } from "../../../Repository/PlayersRepository";
import ServerEvents from "../../../ServerEvents";
import { Message, MessageSocketResponse } from "../AbstractMessageHandler";
import BattleyeMessageHandler from "./BattleyeMessageHandler";

class PlayersHandler extends BattleyeMessageHandler {
    cacheRepo: CacheRepository;
    playersRepo: IPlayersRepository;
    serverIp: string;

    public constructor(
        cacheRepo: CacheRepository,
        playersRepo: IPlayersRepository,
        serverIp: string
    ) {
        super();
        this.cacheRepo = cacheRepo;
        this.playersRepo = playersRepo;
        this.serverIp = serverIp;
    }

    public handle(message: Message): MessageSocketResponse {
        let players: Player[] = PlayersHandler.parsePlayersData(message.content);

        players.map((player: Player) => {
            let playerRecord = this.playersRepo.findByGuid(player.guid);

            if (playerRecord === null) {
                playerRecord = PlayerRecord.fromPlayer(player);
            } else {
                playerRecord.lastSeen = this.serverIp;
                playerRecord.lastSeenDate = new Date();
            }

            player.syncRecord(playerRecord);
            this.playersRepo.upsert(playerRecord);

            return player;
        });

        let playerRecords = this.playersRepo.all();

        this.cacheRepo.set('players', players);

        return {
            type: ServerEvents.PLAYERS,
            data: {
                players: players,
                playerRecords: playerRecords
            }
        };
    }

    public canHandle(message: Message): boolean {
        return message.content.startsWith('Players on server:')
    }

    private static parsePlayersData(message: string): Player[] {
        let playerData = message.trim().split('\n');
        playerData.shift();
        playerData.shift();
        playerData.shift();
        playerData.pop();

        let players = [];
        for (let i = 0; i < playerData.length; i++) {
            let status = playerData[i].includes('(Lobby)') ? "In Lobby" : "Alive";
            let player = playerData[i].replace('(Lobby)', '').replace(/\s+/g, ' ').trim().split(' ');

            players.push(new Player({
                id: parseInt(player[0]),
                ip: player[1],
                ping: parseInt(player[2]),
                guid: player[3].replace('(OK)', ''),
                name: player.slice(4).join(' '),
                status: status,
            }));
        }

        return players;
    }
}

export default PlayersHandler;
