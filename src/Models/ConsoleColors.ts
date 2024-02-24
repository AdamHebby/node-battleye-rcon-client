import ServerEvents from "../ServerEvents";

declare type TConsoleColor = {
    event: ServerEvents;
    color: string;
    enabled: boolean|number;
};

class ConsoleColor implements TConsoleColor {
    public event: ServerEvents;
    public color: string;
    public enabled: boolean|number;

    public constructor(event: ServerEvents, color: string, enabled: boolean) {
        this.event = event;
        this.color = color;
        this.enabled = enabled;
    }

    public static fromJson(json: TConsoleColor): ConsoleColor {
        return new ConsoleColor(json.event, json.color, Boolean(json.enabled));
    }

    public toJson(): TConsoleColor {
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