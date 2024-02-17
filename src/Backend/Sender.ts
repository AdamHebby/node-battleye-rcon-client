import websocket from 'ws';
import BattleEyeClient from '../../node_modules/battle-eye-client/index';
import ServerEvents from '../ServerEvents';
import { InboundSocketMessage, MessageSocketResponse } from './MessageHandlers/AbstractMessageHandler';

declare interface Sender {
    send(data: object|string): void;
}

class SocketSender implements Sender {
    constructor(
        private socket: websocket.Server
    ) {
    }

    public send(data: string|MessageSocketResponse): void {
        if (this.socket.clients.size === 0) {
            return;
        }

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
            console.log(`${new Date().toLocaleTimeString()}: RELAYING REPLY ${JSON.stringify(data)}`);
        }

        this.socket.clients.forEach(function (websocket) {
            websocket.send(JSON.stringify(data));
        });
    }

    public reply(original: InboundSocketMessage, response: MessageSocketResponse): void {
        if (original.id !== undefined && original.id !== null) {
            response.id = original.id;
        }

        this.send(response);
    }
}

class RconSender implements Sender {
    constructor(
        private rcon: BattleEyeClient | null
    ) {
    }

    send(data: string): void {
        if (this.rcon === null) return;

        console.log(`${new Date().toLocaleTimeString()}: RUNNING CMD ${data}`);

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

export { Sender, SocketSender, RconSender };