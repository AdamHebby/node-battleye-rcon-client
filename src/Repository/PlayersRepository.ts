import { NartUser } from "../Models/NartUser";
import PlayerRecord from "../Models/PlayerRecord";
import AbstractRepository from "./AbstractRepository";
import DatabaseManager from "./DatabaseManager";

class PlayersRepository extends AbstractRepository
{
    public static repo(user: NartUser): PlayersRepository
    {
        return new PlayersRepository(
            DatabaseManager.getConnection(`users/${user.usernameDbKey()}`, user.dbKey)
        );
    }

    public upsert(player: PlayerRecord): PlayerRecord {
        let db = this.getConnection();
        let previous = this.findByGuid(player.guid);

        if (previous !== undefined && previous !== null) {
            player.id = previous.id;

            this.updateTable('players', [
                { key: 'lastIp', value: player.lastIp },
                { key: 'name', value: player.name },
                { key: 'nickname', value: player.nickname },
                { key: 'comment', value: player.comment },
                { key: 'lastSeen', value: player.lastSeen },
                { key: 'lastSeenDate', value: player.lastSeenDate.toLocaleString() }
            ], { key: 'id', value: player.id });

            return player;
        }

        let id = this.insertInto('players', [
            { key: 'lastIp', value: player.lastIp },
            { key: 'guid', value: player.guid },
            { key: 'name', value: player.name },
            { key: 'nickname', value: player.nickname },
            { key: 'comment', value: player.comment },
            { key: 'lastSeen', value: player.lastSeen },
            { key: 'lastSeenDate', value: player.lastSeenDate.toLocaleString() }
        ], true);

        if (id !== undefined && id !== null) {
            player.id = id;
        }

        return player;
    }

    public upsertMany(players: PlayerRecord[]): PlayerRecord[] {
        for (let player of players) {
            player = this.upsert(player);
        }

        return players;
    }

    public all(): PlayerRecord[] {
        let players = this.many('SELECT * FROM players', []);

        return players.map((player: PlayerRecord) => {
            player.previousNames = this.getPreviousNames(player.id);
            player.previousIps   = this.getPreviousIps(player.id);

            return PlayerRecord.fromJson(player)
        });
    }

    public getPreviousNames(id: number): string[] {
        let db = this.getConnection();
        let stmt = db.prepare('SELECT name FROM player_previous_names WHERE player_id = ?');
        let names: any[] = stmt.all(id);

        return names.map((name) => name.name);
    }

    public getPreviousIps(id: number): string[] {
        let db = this.getConnection();
        let stmt = db.prepare('SELECT ip FROM player_previous_ips WHERE player_id = ?');
        let ips: any[] = stmt.all(id);

        return ips.map((ip) => ip.ip);
    }

    public updateComment(id: number, comment: string) {
        let db = this.getConnection();
        let stmt = db.prepare('UPDATE players SET comment = ? WHERE id = ?');
        stmt.run(comment, id);
    }

    public updateNickname(id: number, nickname: string) {
        let db = this.getConnection();
        let stmt = db.prepare('UPDATE players SET nickname = ? WHERE id = ?');
        stmt.run(nickname, id);
    }

    public find(id: number): PlayerRecord|null {
        let player = this.one('SELECT * FROM players WHERE id = ?', [id])

        if (player === undefined || player === null) {
            return null;
        }

        player.previousNames = this.getPreviousNames(player.id);
        player.previousIps   = this.getPreviousIps(player.id);

        return PlayerRecord.fromJson(player);
    }

    public findByGuid(guid: string): PlayerRecord|null {
        let player = this.one('SELECT * FROM players WHERE guid = ?', [guid])

        if (player === undefined || player === null) {
            return null;
        }

        player.previousNames = this.getPreviousNames(player.id);
        player.previousIps   = this.getPreviousIps(player.id);

        return PlayerRecord.fromJson(player);
    }

    public findByIp(ip: string): PlayerRecord|null {
        let player = this.one('SELECT * FROM players WHERE lastIp = ?', [ip])

        if (player === undefined || player === null) {
            return null;
        }

        player.previousNames = this.getPreviousNames(player.id);
        player.previousIps   = this.getPreviousIps(player.id);

        return PlayerRecord.fromJson(player);
    }

    public findByIpWithoutPort(ip: string): PlayerRecord|null {
        let player = this.one('SELECT * FROM players WHERE lastIp LIKE ?', [ip.split(':')[0] + '%'])

        if (player === undefined || player === null) {
            return null;
        }

        player.previousNames = this.getPreviousNames(player.id);
        player.previousIps   = this.getPreviousIps(player.id);

        return PlayerRecord.fromJson(player);
    }

    public findByName(name: string): PlayerRecord|null {
        let player = this.one('SELECT * FROM players WHERE name = ?', [name.trim()])

        if (player === undefined || player === null) {
            return null;
        }

        player.previousNames = this.getPreviousNames(player.id);
        player.previousIps   = this.getPreviousIps(player.id);

        return PlayerRecord.fromJson(player);
    }

    public findRecentByName(name: string): PlayerRecord|null {
        let player = this.one('SELECT * FROM players WHERE name = ? ORDER BY lastSeenDate DESC LIMIT 1', [name.trim()])

        if (player === undefined || player === null) {
            return null;
        }

        player.previousNames = this.getPreviousNames(player.id);
        player.previousIps   = this.getPreviousIps(player.id);

        return PlayerRecord.fromJson(player);
    }

    public delete(id: number) {
        let db = this.getConnection();
        let stmt = db.prepare('DELETE FROM players WHERE id = ?');
        stmt.run(id);
    }

    public truncate() {
        let db = this.getConnection();
        let stmt = db.prepare('DELETE FROM players');
        stmt.run();
    }

    private one(sql: string, params: any[]): null | PlayerRecord {
        let db = this.getConnection();
        let stmt = db.prepare(sql);

        return stmt.get(params) as PlayerRecord | null;
    }

    private many(sql: string, params: any[]): PlayerRecord[] {
        let db = this.getConnection();
        let stmt = db.prepare(sql);

        return stmt.all(params) as PlayerRecord[];
    }
}


export default PlayersRepository;
