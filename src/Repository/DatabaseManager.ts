import fs from "fs";
import Database, { Database as DB } from "better-sqlite3-multiple-ciphers";
import Registry from "winreg";

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
        let path = this.getPath(name);
        let db   = new Database(path);

        if (password === null) {
            password = this.getPassword();

            if (password === null) {
                password = this.generatePassword();
                this.storePassword(password);
                db.pragma(`rekey='${password}'`);
            } else {
                db.pragma(`key='${password}'`);
            }
        } else {
            db.pragma(`key='${password}'`);
        }

        if (type === DatabaseType.MAIN || (type === null && name === 'main')) {
            this.mainSchema(db);
        } else if (type === DatabaseType.USERS || (type === null && name.startsWith('users/'))) {
            this.userSchema(db);
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
        try {
            (new Registry({
                hive: Registry.HKCU,
                key:  '\\Software\\Nart'
            })).create(() => {});

            let regKey = new Registry({
                hive: Registry.HKCU,
                key:  '\\Software\\Nart\\CurrentVersion'
            });

            if (regKey.arch === null) {
                throw new Error('Could not determine registry architecture');
            }

            regKey.create(() => {});

            regKey.set('db_key', 'REG_SZ', password, (e) => {
                console.error(e);
            });
        } catch (error) {
            fs.writeFileSync(process.env.HOME + '/.nart/.pw', password);
        }
    }

    private static getPassword(): null|string {
        if (fs.existsSync(process.env.HOME + '/.nart/.pw')) {
            return fs.readFileSync(process.env.HOME + '/.nart/.pw').toString();
        }

        try {
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
        } catch (error) {
        }

        return null;
    }

    private static getPath(name: string): string {
        let appDataOrHome = process.env?.APPDATA ?? process.env.HOME;

        if (appDataOrHome === undefined) {
            throw new Error('Could not determine app data or home directory');
        }

        if (fs.existsSync(appDataOrHome + '/.nart') === false) {
            fs.mkdirSync(appDataOrHome + '/.nart');
        }

        if (fs.existsSync(appDataOrHome + '/.nart/users') === false) {
            fs.mkdirSync(appDataOrHome + '/.nart/users');
        }


        return `${appDataOrHome}/.nart/${name}.db`;
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
