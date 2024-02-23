import AdminDisconnectHandler from "../../../../../src/Backend/MessageHandlers/Battleye/AdminDisconnectHandler";
import ServerEvents from "../../../../../src/ServerEvents";

describe("AdminDisconnectHandler", () => {
    it("should handle admin disconnect messages", () => {
        const message = {
            content: "RCon admin #14 (192.168.0.1) logged out"
        };

        const adminDisconnectHandler = new AdminDisconnectHandler();

        const canHandle = adminDisconnectHandler.canHandle(message);
        const response = adminDisconnectHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response).toEqual({
            type: ServerEvents.CHAT_ADMIN_LEAVE,
            data: {
                message: "RCon admin #14 (192.168.0.1) logged out"
            }
        });
    });

    it("should not handle non-admin disconnect messages", () => {
        const adminDisconnectHandler = new AdminDisconnectHandler();

        expect(adminDisconnectHandler.canHandle({
            content: "RCon admin #14 (192.168.0.1) logged in"
        })).toBe(false);

        expect(adminDisconnectHandler.canHandle({
            content: "(Global) Survivor: Hello, world!"
        })).toBe(false);

        expect(adminDisconnectHandler.canHandle({
            content: "(Global) Survivor: RCon admin #14 (192.168.0.1) logged out"
        })).toBe(false);

        expect(adminDisconnectHandler.canHandle({
            content: "RCon admin #1: (Global) RCon admin #14 (192.168.0.1) logged out"
        })).toBe(false);
    });
});
