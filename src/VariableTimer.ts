class VariableTimer {
    public name: string;
    public time: number;

    private callback: () => void;
    private timer: NodeJS.Timeout | null = null;

    constructor(name: string, callback: () => void, time: number) {
        this.callback = callback;
        this.time = time;
        this.name = name;
    }

    public start(time: number | null = null) {
        this.time = time ?? this.time;

        if (this.timer !== null) {
            return;
        }

        const timer = () => {
            this.timer = setTimeout(() => {
                this.callback();
                timer();
            }, this.time);
        };

        timer();
    }

    public setTime(time: number): VariableTimer {
        this.time = time;

        return this;
    }

    public stop() {
        if (this.timer !== null) {
            clearTimeout(this.timer);
        }
        this.timer = null;
    }
}

export default VariableTimer;
