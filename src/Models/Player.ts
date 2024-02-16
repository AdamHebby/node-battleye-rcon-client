import PlayerRecord from "./PlayerRecord";

class Player {
    public id: number|null = null;
    public dbId: number|null = null;
    public ip: string;
    public ping: number|null = null;
    public guid: string;
    public name: string;
    public status: string|null = null;

    public record: PlayerRecord|null = null;

    constructor(data: any) {
        this.id = data.id;
        this.dbId = data.dbId;
        this.ip = data.ip;
        this.ping = data.ping;
        this.guid = data.guid;
        this.name = data.name;
        this.status = data.status;
    }

    public static fromJson(data: any): Player {
        return new Player(data);
    }

    public syncRecord(playerRecord: PlayerRecord): void {
        this.dbId = playerRecord.id;
        this.record = playerRecord;
        playerRecord.name = this.name;
        playerRecord.lastIp = this.ip;
    }

    public toJson(): any {
        return {
            id: this.id,
            dbId: this.dbId,
            ip: this.ip,
            ping: this.ping,
            guid: this.guid,
            name: this.name,
            status: this.status,
        };
    }
}

export default Player;