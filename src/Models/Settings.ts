interface Setting {
    key: string;
    value: any;
}

class Settings {
    public settings: Setting[] = [
        { key: "admins-refresh-interval", value: 7 },
        { key: "players-refresh-interval", value: 3 },
        { key: "bans-refresh-interval", value: 5 },
        { key: "debug-messages", value: 1 },
        { key: "error-messages", value: 1 },
        { key: "global-chat-messages", value: 1 },
        { key: "admin-chat-messages", value: 1 },
        { key: "admin-join-leave-messages", value: 1 },
        { key: "player-join-leave-messages", value: 1 },
        { key: "color-chat", value: 1 },
    ];

    public defaults: Setting[] = [
        { key: "admins-refresh-interval", value: 7 },
        { key: "players-refresh-interval", value: 3 },
        { key: "bans-refresh-interval", value: 5 },
        { key: "debug-messages", value: 1 },
        { key: "error-messages", value: 1 },
        { key: "global-chat-messages", value: 1 },
        { key: "admin-chat-messages", value: 1 },
        { key: "admin-join-leave-messages", value: 1 },
        { key: "player-join-leave-messages", value: 1 },
        { key: "color-chat", value: 1 },
    ];

    public static fromJson(json: Setting[]): Settings {
        let settings = new Settings();

        for (let key in json) {
            settings.set(json[key].key, json[key].value);
        }

        return settings;
    }

    public get(key: string): any {
        let setting = this.find(key);

        if (setting) {
            return setting.value;
        }

        return null;
    }

    public set(key: string, value: any): void {
        let setting = this.find(key);

        if (setting) {
            setting.value = value;
        }
    }

    public toJson(): Setting[] {
        return this.settings;
    }

    private find(key: string): Setting | null {
        for (let settingKey in this.settings) {
            if (this.settings[settingKey].key === key) {
                return this.settings[settingKey];
            }
        }

        return null;
    }
}

export default Settings;