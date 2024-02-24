import Player from "./Player";

declare type TPlayerRecord = {
    id: number,
    lastIp: string,
    guid: string,
    name: string,
    nickname: null|string,
    comment: null|string,
    lastSeen: string,
    lastSeenDate: Date|null|string,
    previousIps?: string[],
    previousNames?: string[]
}

class PlayerRecord implements TPlayerRecord {
    public id: number;
    public lastIp: string;
    public guid: string;
    public name: string;
    public nickname: null|string;
    public comment: null|string;
    public lastSeen: string;
    public lastSeenDate: Date;
    public previousIps: string[] = [];
    public previousNames: string[] = [];

    constructor(data: TPlayerRecord) {
        this.id = data.id;
        this.lastIp = data.lastIp;
        this.guid = data.guid;
        this.name = data.name;
        this.nickname = data.nickname;
        this.comment = data.comment;
        this.lastSeen = data.lastSeen;
        this.lastSeenDate = new Date(data.lastSeenDate?.toString() ?? new Date().toISOString());
        this.previousIps = data.previousIps ?? [];
        this.previousNames = data.previousNames ?? [];
    }

    public static fromJson(data: TPlayerRecord): PlayerRecord {
        return new PlayerRecord(data);
    }

    public static fromPlayer(player: Player): PlayerRecord {
        return new PlayerRecord({
            id: player.dbId ?? -1,
            lastIp: player.ip,
            guid: player.guid,
            name: player.name,
            nickname: null,
            comment: null,
            lastSeen: player.ip,
            lastSeenDate: new Date(),
        });
    }

    public toJson(): TPlayerRecord {
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