import PlayerRecord from "../../../src/Models/PlayerRecord";
import { IPlayersRepository } from "../../../src/Repository/PlayersRepository";

/**
 * Super dumb mock for PlayersRepository
 */
export default class PlayersRepositoryMock implements IPlayersRepository
{
    public data: PlayerRecord[] = [];

    public contains(id: number): boolean
    {
        return this.find(id) !== null;
    }

    public containsGuid(guid: string): boolean
    {
        return this.findByGuid(guid) !== null;
    }

    public containsIp(ip: string): boolean
    {
        return this.findByIp(ip) !== null;
    }

    public containsName(name: string): boolean
    {
        return this.findByName(name) !== null;
    }

    public upsert(player: PlayerRecord): PlayerRecord
    {
        let existingPlayer = this.find(player.id);
        if (existingPlayer !== null && existingPlayer.guid === player.guid) {
            existingPlayer.lastSeen = player.lastSeen;
            return player;
        }

        this.data.push(player);
        return player;
    }

    public upsertMany(players: PlayerRecord[]): PlayerRecord[]
    {
        let updatedPlayers: PlayerRecord[] = [];

        for (let player of players) {
            updatedPlayers.push(this.upsert(player));
        }

        return updatedPlayers;
    }

    public all(): PlayerRecord[]
    {
        return this.data;
    }

    public getPreviousNames(id: number): string[]
    {

        let player = this.find(id);
        if (player) {
            return player.previousNames;
        }

        return [];
    }

    public getPreviousIps(id: number): string[]
    {
        let player = this.find(id);
        if (player) {
            return player.previousIps;
        }

        return [];
    }

    public updateComment(id: number, comment: string): void
    {
        let player = this.find(id);
        if (player) {
            player.comment = comment;
        }
    }

    public updateNickname(id: number, nickname: string): void
    {
        let player = this.find(id);
        if (player) {
            player.nickname = nickname;
        }
    }

    public find(id: number): PlayerRecord|null
    {
        return this.data.find((player) => player.id === id) || null;
    }

    public findByGuid(guid: string): PlayerRecord|null
    {
        return this.data.find((player) => player.guid === guid) || null;
    }

    public findByIp(ip: string): PlayerRecord|null
    {
        return this.data.find((player) => player.lastIp === ip) || null;
    }

    public findByIpWithoutPort(ip: string): PlayerRecord|null
    {
        return this.data.find((player) => player.lastIp.split(':')[0] === ip.split(':')[0]) || null;
    }

    public findByName(name: string): PlayerRecord|null
    {
        return this.data.find((player) => player.name === name) || null;
    }

    public findRecentByName(name: string): PlayerRecord|null
    {
        return this.data.find((player) => player.name === name) || null;
    }

    public delete(id: number): void
    {
        this.data.splice(this.data.findIndex((player) => player.id === id), 1);
    }

    public truncate(): void
    {
        this.data = [];
    }
}
