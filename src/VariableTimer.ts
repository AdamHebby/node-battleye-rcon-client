class VariableTimer {
    public name: string;
    public time: number;

    private _callback: () => void;
    private timer: NodeJS.Timeout | null = null;

    constructor(name: string, callback: () => void, time: number) {
        this._callback = callback;
        this.time = time;
        this.name = name;
    }

    public start(time: number | null = null) {
        let self = this;

        if (this.timer !== null) {
            return;
        }

        (function timer() {
            self.timer = setTimeout(function () {
                self._callback();
                timer();
            }, time || self.time);
        })();
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
