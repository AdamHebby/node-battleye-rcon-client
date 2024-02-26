import websocket from 'ws';
import BattleEyeClient from '../../node_modules/battle-eye-client/index';
import ServerEvents from '../ServerEvents';
import { InboundSocketMessage, MessageSocketResponse } from './MessageHandlers/AbstractMessageHandler';
import { Logger } from '../Logger';

declare interface Sender {
    send(data: object|string): void;
}

declare interface IRconSender {
    updateRcon(rcon: BattleEyeClient | null): void;
    send(data: object|string): void;
}

declare interface ISocketSender {
    reply(original: InboundSocketMessage, response: MessageSocketResponse): void;
}

class SocketSender implements Sender, ISocketSender {
    constructor(
        private socket: websocket
    ) {
    }

    public send(data: string|MessageSocketResponse): void {
        // if data is string, convert to object
        if (typeof(data) === "string") {
            if (data.toString().trim() === '') {
                return;
            }

            data = {
                type: ServerEvents.MESSAGE,
                data: data
            };
        }

        // make the logs less noisy for development
        if (
            'type' in data &&
            data.type !== ServerEvents.PLAYERS &&
            data.type !== ServerEvents.BANS &&
            data.type !== ServerEvents.ADMINS &&
            data.type !== ServerEvents.SETTINGS_LIST &&
            data.type !== ServerEvents.COLORS_LIST &&
            data.type !== ServerEvents.SERVERS_LIST
        ) {
            Logger.normalLogger().debug(`RELAYING REPLY ${JSON.stringify(data)}`);
        }

        this.socket.send(JSON.stringify(data));
    }

    public reply(original: InboundSocketMessage, response: MessageSocketResponse): void {
        if (original.id !== undefined && original.id !== null) {
            response.id = original.id;
        }

        this.send(response);
    }
}

class RconSender implements Sender, IRconSender {
    constructor(
        private rcon: BattleEyeClient | null
    ) {
    }

    send(data: string): void {
        if (this.rcon === null) return;

        Logger.normalLogger().debug(`RUNNING CMD ${data}`);

        try {
            this.rcon.sendCommand(data);
        } catch (error) {
            throw new Error(`Error sending command to RCON: ${error}`);
        }
    }

    public updateRcon(rcon: BattleEyeClient | null): void {
        this.rcon = rcon;
    }
}

class RconSenderMock implements Sender, IRconSender {
    public constructor(
        private callback: (data: string) => void = () => {}
    ) {
        Logger.normalLogger().debug(`RCON MOCK`);
    }

    public send(data: string): void {
        Logger.normalLogger().debug(`MOCKING CMD ${data}`);
        this.callback(data);
    }

    public updateRcon(_: BattleEyeClient | null): void {
    }
}

export { Sender, SocketSender, RconSender, RconSenderMock, IRconSender, ISocketSender };
