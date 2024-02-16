import ServerEvents from "../ServerEvents";

class ConsoleColor {
    public event: ServerEvents;
    public color: string;
    public enabled: boolean|number;

    public constructor(event: ServerEvents, color: string, enabled: boolean) {
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