import AdminConnectHandler from "../../../../../src/Backend/MessageHandlers/Battleye/AdminConnectHandler";
import ServerEvents from "../../../../../src/ServerEvents";

describe("AdminConnectHandler", () => {
    it("should handle admin connect messages", () => {
        const message = {
            content: "RCon admin #14 (192.168.0.1) logged in"
        };

        const adminConnectHandler = new AdminConnectHandler();

        const canHandle = adminConnectHandler.canHandle(message);
        const response = adminConnectHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response).toEqual({
            type: ServerEvents.CHAT_ADMIN_JOIN,
            data: {
                message: "RCon admin #14 (192.168.0.1) logged in"
            }
        });
    });

    it("should not handle non-admin connect messages", () => {
        const adminConnectHandler = new AdminConnectHandler();

        expect(adminConnectHandler.canHandle({
            content: "RCon admin #14 (192.168.0.1) logged out"
        })).toBe(false);

        expect(adminConnectHandler.canHandle({
            content: "(Global) Survivor: Hello, world!"
        })).toBe(false);

        expect(adminConnectHandler.canHandle({
            content: "(Global) Survivor: RCon admin #14 (192.168.0.1) logged in"
        })).toBe(false);

        expect(adminConnectHandler.canHandle({
            content: "RCon admin #1: (Global) RCon admin #14 (192.168.0.1) logged in"
        })).toBe(false);
    });
});
