import AbstractRepository from "./AbstractRepository";
import Server, { TServer } from '../Models/Server';
import { NartUser } from "../Models/NartUser";
import DatabaseManager from "./DatabaseManager";

export interface IServerRepository {
    upsert(server: Server): Server;
    all(): Server[];
    find(id: number): Server|null;
    delete(id: number): boolean;
}

class ServerRepository extends AbstractRepository implements IServerRepository
{
    public static repo(user: NartUser): IServerRepository
    {
        return new ServerRepository(
            DatabaseManager.getConnection(`users/${user.usernameDbKey()}`, user.dbKey)
        );
    }

    public upsert(server: Server): Server {
        let db = this.getConnection();

        let serverId: number|null = server.id === 0 ? null : server.id;

        let stmt = db.prepare("INSERT OR REPLACE INTO servers (id, name, address, port, password, lastConnected) VALUES (?, ?, ?, ?, ?, ?)");
        stmt.run(serverId, server.name, server.address, server.port, server.password, server.lastConnected?.toLocaleString());

        if (serverId === null) {
            let row = db.prepare('SELECT last_insert_rowid() as id').pluck().get() as {id: number};

            server.id = row.id;
        }

        return server;
    }

    public all(): Server[] {
        let db = this.getConnection();

        let data = db.prepare('SELECT * FROM servers').all() as TServer[]|[];

        let servers: Server[] = [];
        data.forEach(function (row: TServer) {
            servers.push(Server.fromJson(row));
        });

        return servers;
    }

    public find(id: number): Server|null {
        let db = this.getConnection();
        let row = db.prepare('SELECT * FROM servers WHERE id = ?').get(id) as TServer;

        if (row === null) return null;

        return Server.fromJson(row);
    }

    public delete(id: number): boolean {
        let db = this.getConnection();

        let stmt = db.prepare('DELETE FROM servers WHERE id = ?');
        stmt.run(id);

        return true;
    }
}


export default ServerRepository;