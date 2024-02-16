import Events from "../Events";

class ConsoleColor {
    public event: Events;
    public color: string;
    public enabled: boolean|number;

    public constructor(event: Events, color: string, enabled: boolean) {
        this.event = event;
        this.color = color;
        this.enabled = enabled;
    }

    public static fromJson(json: any): ConsoleColor {
        return new ConsoleColor(json.event, json.color, json.enabled);
    }

    public toJson(): any {
        return {
            event: this.event,
            color: this.color,
            enabled: this.enabled
        };
    }
}

export {
    ConsoleColor
};