class Ban {
    public ip: string|null = null;
    public guid: string|null = null;
    public minutesLeft: number;
    public reason: string;

    private expiresAt: Date;

    constructor(ip: string|null, guid: string|null, minutesLeft: number, reason: string) {
        this.ip = ip;
        this.guid = guid;
        this.minutesLeft = minutesLeft;
        this.reason = reason;

        this.expiresAt = new Date();
        this.expiresAt.setMinutes(this.expiresAt.getMinutes() + minutesLeft);
    }

    public static fromJson(json: any): Ban {
        return new Ban(json?.ip, json?.guid, json.minutesLeft, json.reason);
    }

    public toJson(): any {
        return {
            ip: this.ip,
            guid: this.guid,
            minutesLeft: this.minutesLeft,
            reason: this.reason
        };
    }

    public isExpired(): boolean {
        return new Date() > this.expiresAt;
    }

    public getExpiresAtClean(): string {
        return this.expiresAt.toLocaleString();
    }

    public getExpiresAt(): Date {
        return this.expiresAt;
    }

    public getExpiresIn(): string {
        let seconds = Math.floor((this.expiresAt.getTime() - new Date().getTime()) / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);
        let days = Math.floor(hours / 24);

        seconds = seconds % 60;
        minutes = minutes % 60;
        hours = hours % 24;

        let expiresIn = '';

        if (days > 0) {
            expiresIn += days + 'd ';
        }

        if (hours > 0) {
            expiresIn += hours + 'h ';
        }

        if (minutes > 0) {
            expiresIn += minutes + 'm ';
        }

        if (seconds > 0) {
            expiresIn += seconds + 's';
        }

        return expiresIn;
    }
}

export default Ban;
