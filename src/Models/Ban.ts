class Ban {
    public id: number;
    public ip: string|null = null;
    public guid: string|null = null;
    public minutesLeft: number;
    public reason: string;

    private expiresAt?: Date|null = null;

    constructor(id: number, ip: string|null, guid: string|null, minutesLeft: number, reason: string) {
        this.id = id;
        this.ip = ip;
        this.guid = guid;
        this.minutesLeft = minutesLeft;
        this.reason = reason;

        if (minutesLeft === -1) {
            return;
        }

        this.expiresAt = new Date();
        this.expiresAt.setMinutes(this.expiresAt.getMinutes() + minutesLeft);
    }

    public static fromJson(json: any): Ban {
        return new Ban(json.id, json?.ip, json?.guid, json.minutesLeft, json.reason);
    }

    public toJson(): any {
        return {
            id: this.id,
            ip: this.ip,
            guid: this.guid,
            minutesLeft: this.minutesLeft,
            reason: this.reason
        };
    }

    public isExpired(): boolean {
        if (!this.expiresAt && this.minutesLeft === -1) {
            return false;
        }

        if (!this.expiresAt) {
            return true;
        }

        return new Date() > this.expiresAt;
    }

    public getExpiresAtClean(): string {
        if (!this.expiresAt) {
            return 'Permanent';
        }
        return this.expiresAt.toLocaleString();
    }

    public getExpiresAt(): Date|null {
        if (!this.expiresAt) {
            return null;
        }

        return this.expiresAt;
    }
}

export default Ban;
