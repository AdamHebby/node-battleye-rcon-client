import BattleEyeClient from 'battle-eye-client';

declare interface IBattleEyeClient
{
    ip: string;
    mockHandler: (message: string) => null|string;
    messageHandler: (message: string) => void;
    timeoutHandler: () => void;
    close(): void;
    sendCommand(message: string): void;
    connect(): void;
}

class BattleEyeClientWrapper implements IBattleEyeClient
{
    public mockHandler: (message: string) => null|string = () => null;
    public messageHandler: (message: string) => void = () => {};
    public timeoutHandler: () => void = () => {};
    public ip: string = '';

    constructor(
        private rcon: BattleEyeClient
    ) {
        this.ip = this.rcon.ip;

        this.rcon.messageHandler = (message: string) => this.messageHandler(message);
        this.rcon.timeoutHandler = () => this.timeoutHandler();
    }

    public close(): void {
        this.rcon.close();
    }

    public connect(): void {
        this.rcon.connect();
    }

    public sendCommand(message: string): void {
        this.rcon.sendCommand(message);
    }
}

class MockBattleEyeClientWrapper implements IBattleEyeClient
{
    private closed = true;

    public mockHandler: (message: string) => null|string = () => null;
    public messageHandler: (message: string) => void = () => {};
    public timeoutHandler: () => void = () => {};
    public ip: string = '127.0.0.1:12701';

    constructor(
        private _: null|BattleEyeClient = null
    ) {
    }

    public close(): void {
        this.closed = true;
        return;
    }

    public sendCommand(message: string): void {
        if (this.closed) {
            this.timeoutHandler();
            return;
        }

        let mockResponse = this.mockHandler(message);
        if (mockResponse === null) {
            return;
        }

        this.messageHandler(mockResponse);
        return;
    }

    public connect(): void {
        this.closed = false;
        return;
    }
}

export {
    BattleEyeClientWrapper,
    MockBattleEyeClientWrapper,
    IBattleEyeClient
};
