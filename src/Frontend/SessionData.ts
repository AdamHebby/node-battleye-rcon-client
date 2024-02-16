import Server from "../Models/Server";

class SessionData {
    public static storeData(key: string, value: any): void {
        localStorage.setItem(key, JSON.stringify(value));
    }

    public static retrieveData(key: string): null|any {
        let item = localStorage.getItem(key);

        if (item === null) {
            return null;
        }

        return JSON.parse(item);
    }

    public storeServer(server: Server): void {
        let servers = SessionData.retrieveData("servers");

        if (servers === null) {
            servers = [];
        }

        servers.push(server.toJson());
        SessionData.storeData("servers", servers);
    }

    public retrieveServers(): Server[] {
        let servers = SessionData.retrieveData("servers");

        if (servers === null) {
            return [];
        }

        servers = servers.map((server: any) => {
            return Server.fromJson(server);
        });

        return servers;
    }
}

export default SessionData;