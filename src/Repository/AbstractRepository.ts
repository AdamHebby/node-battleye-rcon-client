// const sqlite3 = require('@journeyapps/sqlcipher');
import fs from "fs";
import Database, { Database as DB } from "better-sqlite3";
import Registry from "winreg";

abstract class AbstractRepository
{
    public getConnection(): DB
    {
        let appData = process.env?.APPDATA ?? process.env.HOME;
        let path = appData + '/nart.db';
        let db: DB;
        let pw = this.getPassword();

        let newDb = false;
        if (pw === null) {
            pw = this.generatePassword();
            this.storePassword(pw);
            newDb = true;
        }

        if (newDb) {
            if (fs.existsSync(path)) {
                fs.renameSync(path, path + '.old');
            }
        }

        db = new Database(appData + '/nart.db');

        // if (!newDb) {
        //     return db;
        // }

        db.exec("PRAGMA cipher_compatibility = 4");
        db.exec(`PRAGMA key = '${pw}'`);

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

        db.exec(`CREATE INDEX IF NOT EXISTS idx_players_guid ON players (guid);`);

        return db;
    }

    private generatePassword() {
        const length = 256;
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            password += characters[randomIndex];
        }

        return password;
    }

    private storePassword(password: string) {
        try {
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
                console.error(e);
            });
        } catch (error) {
            fs.writeFileSync(process.env.HOME + '/.nart', password);
        }
    }

    private getPassword(): string|null {
        let password = null;

        try {
            let regKey = new Registry({
                hive: Registry.HKCU,
                key:  '\\Software\\Nart\\CurrentVersion'
            });

            if (regKey.valueExists('db_key', () => {})) {
                regKey.get('db_key', (_, res) => {
                    if (res?.value !== undefined) {
                        return res.value;
                    }
                });
            }
        } catch (error) {

        }

        if (fs.existsSync(process.env.HOME + '/.nart')) {
            return fs.readFileSync(process.env.HOME + '/.nart').toString();
        }

        return password;
    }
}

export default AbstractRepository;
