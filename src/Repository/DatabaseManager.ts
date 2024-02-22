import fs, { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import Database, { Database as DB, SqliteError } from "better-sqlite3-multiple-ciphers";
import Registry from "winreg";
import { NartConfig } from "../NartConfig";
import { Logger } from "../Logger";

enum DatabaseType {
    MAIN = 'main',
    USERS = 'users'
}

class DatabaseManager
{
    public static main(): DB {
        return this.getConnection('main');
    }

    public static getConnection(name: string, password: string|null = null, type: DatabaseType|null = null): DB {
        let path  = this.getPath(name);
        let db    = new Database(path);
        let newDb = false;

        if (password === null && NartConfig.config().auth.enabled) {
            password = this.getPassword();

            if (password === null) {
                password = this.generatePassword(NartConfig.config().auth.dbKeyLength);
                this.storePassword(password);
                newDb = true;
            }
        }

        try {
            if (newDb) {
                db.pragma(`rekey='${password}'`);
            } else {
                db.pragma(`key='${password}'`);
            }

            if (type === DatabaseType.MAIN || (type === null && name === 'main')) {
                this.mainSchema(db);
            } else if (type === DatabaseType.USERS || (type === null && name.startsWith('users/'))) {
                this.userSchema(db);
            }
        } catch (error: any) {
            if (error?.code === 'SQLITE_NOTADB') {
                Logger.normalLogger().error(`Database at ${path} is not a valid database or is encrypted with a different key`);
                process.exit(1);
            }

            throw error;
        }

        return db;
    }

    protected static generatePassword(length: number = 256) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            password += characters[randomIndex];
        }

        return password;
    }

    private static storePassword(password: string) {
        let storage = NartConfig.instance().getStorage();
        let isWindows = process.platform === 'win32';

        try {
            if (storage.dbKey.regKey === true && isWindows) {
                (new Registry({
                    hive: Registry.HKCU,
                    key:  '\\Software\\Nart'
                })).create(() => {});

                let regKey = new Registry({
                    hive: Registry.HKCU,
                    key:  '\\Software\\Nart\\CurrentVersion'
                });

                regKey.create(() => {});

                regKey.set('db_key', 'REG_SZ', password, (e) => {
                    Logger.normalLogger().error(e);
                });

                return;
            }

            if (storage.dbKey.path === undefined || storage.dbKey.path === null) {
                throw new Error('Could not determine where to store the password');
            }

            Logger.normalLogger().debug(`Writing password to ${storage.dbKey.path}`)
            writeFileSync(storage.dbKey.path, password);
        } catch (error) {
            // TODO: Should we throw an error here rather than falling back?
            if (storage.dbKey.path === undefined || storage.dbKey.path === null) {
                throw new Error('Could not determine where to store the password');
            }

            Logger.normalLogger().debug(`Writing password to ${storage.dbKey.path}`)
            writeFileSync(storage.dbKey.path, password);
        }
    }

    private static getPassword(): null|string {
        let storage = NartConfig.instance().getStorage();
        let isWindows = process.platform === 'win32';

        if (storage.dbKey.path && existsSync(storage.dbKey.path)) {
            return readFileSync(storage.dbKey.path).toString();
        }

        try {
            if (storage.dbKey.regKey === true && isWindows) {
                let regKey = new Registry({
                    hive: Registry.HKCU,
                    key:  '\\Software\\Nart\\CurrentVersion'
                });

                if (regKey.arch !== null && regKey.valueExists('db_key', () => {})) {
                    regKey.get('db_key', (_, res) => {
                        if (res?.value !== undefined) {
                            return res.value;
                        }
                    });
                }
            }
        } catch (error) {
        }

        return null;
    }

    private static getPath(name: string): string {
        let storageRoot = NartConfig.instance().getStorage();

        if (existsSync(storageRoot.path) === false) {
            mkdirSync(storageRoot.path);
        }

        if (existsSync(`${storageRoot.path}/users`) === false) {
            mkdirSync(`${storageRoot.path}/users`);
        }

        return `${storageRoot.path}/${name}.db`;
    }

    private static userSchema(db: DB) {
        db.exec(`
            CREATE TABLE IF NOT EXISTS servers (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                address TEXT NOT NULL,
                port INTEGER NOT NULL,
                password TEXT NOT NULL,
                lastConnected TEXT NULL DEFAULT NULL
            );
        `);

        db.exec(`
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT NOT NULL PRIMARY KEY,
                value TEXT NOT NULL
            );
        `);

        db.exec(`
            CREATE TABLE IF NOT EXISTS console_colors (
                event TEXT NOT NULL PRIMARY KEY,
                color TEXT NOT NULL,
                enabled INTEGER NOT NULL
            );
        `);

        db.exec(`
            CREATE TABLE IF NOT EXISTS players (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,
                lastIp TEXT NOT NULL,
                guid TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                nickname TEXT DEFAULT NULL,
                comment TEXT NULL DEFAULT NULL,
                lastSeen TEXT NULL DEFAULT NULL,
                lastSeenDate TEXT NULL DEFAULT NULL
            );
        `);

        db.exec(`
            CREATE TABLE IF NOT EXISTS player_previous_names (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,
                player_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(player_id) REFERENCES players(id) ON DELETE CASCADE
            );
        `);

        db.exec(`
            CREATE TABLE IF NOT EXISTS player_previous_ips (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,
                player_id INTEGER NOT NULL,
                ip TEXT NOT NULL,
                date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(player_id) REFERENCES players(id) ON DELETE CASCADE
            );
        `);

        db.exec(`
            CREATE TRIGGER IF NOT EXISTS player_previous_names_insert
                AFTER UPDATE OF name ON players
                FOR EACH ROW
                    WHEN OLD.name != NEW.name
            BEGIN
                INSERT INTO player_previous_names (player_id, name) VALUES (OLD.id, OLD.name);
            END;
        `);

        db.exec(`
            CREATE TRIGGER IF NOT EXISTS player_previous_ips_insert
                AFTER UPDATE OF lastIp ON players
                FOR EACH ROW
                    WHEN OLD.lastIp != NEW.lastIp
            BEGIN
                INSERT INTO player_previous_ips (player_id, ip) VALUES (OLD.id, OLD.lastIp);
            END;
        `);

        db.exec(`CREATE INDEX IF NOT EXISTS idx_players_guid ON players (guid);`);

    }

    private static mainSchema(db: DB) {
        db.exec(`
            CREATE TABLE IF NOT EXISTS nart_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                permissions INTEGER NOT NULL DEFAULT 0,
                db_key TEXT NOT NULL UNIQUE,
                has_logged_in INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_login TEXT NULL DEFAULT NULL
            );
        `);

        db.exec(`
            CREATE TABLE IF NOT EXISTS nart_users_invite_links (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,
                user_id INTEGER NOT NULL UNIQUE,
                link_hash TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                expires_at TEXT NOT NULL DEFAULT (datetime('now', '+7 days')),
                FOREIGN KEY(user_id) REFERENCES nart_users(id) ON DELETE CASCADE
            );
        `);
    }
}

export default DatabaseManager;
