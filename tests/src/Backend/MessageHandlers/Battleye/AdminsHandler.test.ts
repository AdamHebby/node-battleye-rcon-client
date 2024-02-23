import AdminsHandler from "../../../../../src/Backend/MessageHandlers/Battleye/AdminsHandler";
import ServerEvents from "../../../../../src/ServerEvents";

describe("AdminsHandler", () => {
    it("should handle admins connected messages", () => {
        const message = {
            content: "Connected RCon admins:\n" +
            "[#] [IP Address]:[Port]\n" +
            "-----------------------------\n" +
            "0 192.168.0.1:58606\n" +
            "1 127.0.0.1:19880\n" +
            "2 169.254.120.51:54771\n" +
            "3 233.252.85.56:49701"
        };

        const adminsHandler = new AdminsHandler();

        const canHandle = adminsHandler.canHandle(message);
        const response = adminsHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response).toEqual({
            type: ServerEvents.ADMINS,
            data: [{
                    id: "0",
                    ip: "192.168.0.1",
                    port: "58606"
                },{
                    id: "1",
                    ip: "127.0.0.1",
                    port: "19880"
                },{
                    id: "2",
                    ip: "169.254.120.51",
                    port: "54771"
                },{
                    id: "3",
                    ip: "233.252.85.56",
                    port: "49701"
                },
            ]
        });
    });

    it("should not handle non-admins connected messages", () => {
        const adminsHandler = new AdminsHandler();

        expect(adminsHandler.canHandle({
            content: "RCon admin #14 (192.168.0.1) logged in"
        })).toBe(false);

        expect(adminsHandler.canHandle({
            content: "(Global) Survivor: Connected RCon admins:"
        })).toBe(false);

        expect(adminsHandler.canHandle({
            content: "(Global) Survivor: RCon admin #14 (192.168.0.1) logged out"
        })).toBe(false);

        expect(adminsHandler.canHandle({
            content: "RCon admin #1: (Global) RCon admin #14 (192.168.0.1) logged out"
        })).toBe(false);
    });
});
