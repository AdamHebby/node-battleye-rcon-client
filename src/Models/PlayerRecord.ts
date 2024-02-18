import Player from "./Player";

class PlayerRecord {
    public id: number;
    public lastIp: string;
    public guid: string;
    public name: string;
    public nickname: string;
    public comment: string;
    public lastSeen: string;
    public lastSeenDate: Date;
    public previousIps: string[] = [];
    public previousNames: string[] = [];

    constructor(data: any) {
        this.id = data.id;
        this.lastIp = data.lastIp;
        this.guid = data.guid;
        this.name = data.name;
        this.nickname = data.nickname;
        this.comment = data.comment;
        this.lastSeen = data.lastSeen;
        this.lastSeenDate = new Date(data.lastSeenDate);
        this.previousIps = data.previousIps ?? [];
        this.previousNames = data.previousNames ?? [];
    }

    public static fromJson(data: any): PlayerRecord {
        return new PlayerRecord(data);
    }

    public static fromPlayer(player: Player): PlayerRecord {
        return new PlayerRecord({
            id: player.dbId,
            lastIp: player.ip,
            guid: player.guid,
            name: player.name,
            nickname: null,
            comment: null,
            lastSeen: player.ip,
            lastSeenDate: new Date(),
        });
    }

    public toJson(): any {
        return {
            id: this.id,
            lastIp: this.lastIp,
            guid: this.guid,
            name: this.name,
            nickname: this.nickname,
            comment: this.comment,
            lastSeen: this.lastSeen,
            lastSeenDate: this.lastSeenDate.toLocaleString(),
            previousIps: this.previousIps,
            previousNames: this.previousNames
        };
    }
}

export default PlayerRecord;