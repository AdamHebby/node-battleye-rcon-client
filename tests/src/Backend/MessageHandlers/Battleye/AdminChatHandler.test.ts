import AdminChatHandler from "../../../../../src/Backend/MessageHandlers/Battleye/AdminChatHandler";
import ServerEvents from "../../../../../src/ServerEvents";

describe("AdminChatHandler", () => {
    it("should handle admin chat messages", () => {
        const message = {
            content: "RCon admin #1: (Global) Hello, world!"
        };

        const adminChatHandler = new AdminChatHandler();
        const canHandle = adminChatHandler.canHandle(message);
        const response = adminChatHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response).toEqual({
            type: ServerEvents.CHAT_ADMIN_MESSAGE,
            data: {
                message: "RCon admin #1: (Global) Hello, world!"
            }
        });
    });

    it("should not handle non-admin chat messages", () => {
        const adminChatHandler = new AdminChatHandler();
        expect(adminChatHandler.canHandle({
            content: "(Global) Survivor: Hello, world!"
        })).toBe(false);
    });
});