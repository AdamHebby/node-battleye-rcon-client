import PlayerRecord from "../Models/PlayerRecord";
import AbstractRepository from "./AbstractRepository";

class PlayersRepository extends AbstractRepository
{
    public upsert(player: PlayerRecord): PlayerRecord {
        let id = (player.id === null || player.id === undefined) ? null : player.id;

        let db = this.getConnection();
        if (id === null) {
            let prep = db.prepare('SELECT id FROM players WHERE guid = ?');
            prep.bind(player.guid);
            let newId = prep.pluck().get() as number|null;

            if (newId !== undefined && newId !== null) {
                player.id = newId;
            }
        }

        let stmt = db.prepare(
            'INSERT OR REPLACE INTO players (id, lastIp, guid, name, nickname, comment, lastSeen, lastSeenDate) \
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        stmt.run(player.id, player.lastIp, player.guid, player.name, player.nickname, player.comment, player.lastSeen, player.lastSeenDate.toLocaleString());

        if (player.id === null) {
            let row = db.prepare('SELECT last_insert_rowid() as id').pluck().get() as number;

            if (row !== undefined && row !== null) {
                player.id = row;
            }
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
        let db = this.getConnection();
        let stmt = db.prepare('SELECT * FROM players');
        let players: any[] = stmt.all();

        return players.map((player) => PlayerRecord.fromJson(player));
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
        let db = this.getConnection();
        let stmt = db.prepare('SELECT * FROM players WHERE id = ?');
        let player = stmt.get(id);

        if (player === undefined || player === null) {
            return null;
        }

        return PlayerRecord.fromJson(player);
    }

    public findByGuid(guid: string): PlayerRecord|null {
        let db = this.getConnection();
        let stmt = db.prepare('SELECT * FROM players WHERE guid = ?');
        let player = stmt.get(guid);

        if (player === undefined || player === null) {
            return null;
        }

        return PlayerRecord.fromJson(player);
    }

    public findByIp(ip: string): PlayerRecord|null {
        let db = this.getConnection();
        let stmt = db.prepare('SELECT * FROM players WHERE ip = ?');
        let player = stmt.get(ip);

        if (player === undefined || player === null) {
            return null;
        }

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
}


export default PlayersRepository;
