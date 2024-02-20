import AbstractRepository from "./AbstractRepository";
import Settings from '../Models/Settings';
import { NartUser } from "../Models/NartUser";
import DatabaseManager from "./DatabaseManager";

class SettingsRepository extends AbstractRepository
{
    public static repo(user: NartUser): SettingsRepository
    {
        return new SettingsRepository(
            DatabaseManager.getConnection(`users/${user.usernameDbKey()}`, user.dbKey)
        );
    }

    public upsert(settings: Settings): Settings {
        let db = this.getConnection();
        settings = Settings.fromJson(settings.settings);

        let stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

        for (let i = 0; i < settings.settings.length; i++) {
            stmt.run(settings.settings[i].key, settings.settings[i].value);
        }

        return settings;
    }

    public get(): Settings {
        let db = this.getConnection();

        let stmt = db.prepare('SELECT * FROM settings');
        let settings: [{key: string, value: any}] = stmt.all() as any;


        let settingsObject = new Settings();

        for (let i = 0; i < settings.length; i++) {
            let val = typeof(settings[i].value) === 'number' ? parseInt(settings[i].value) : settings[i].value;

            settingsObject.set(settings[i].key, val);
        }

        return settingsObject;
    }
}


export default SettingsRepository;
