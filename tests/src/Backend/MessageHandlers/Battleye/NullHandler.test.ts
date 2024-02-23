import NullHandler from "../../../../../src/Backend/MessageHandlers/Battleye/NullHandler";

describe("NullHandler", () => {
    it("should handle empty messages", () => {
        const message = {
            content: "   "
        };

        const nullHandler = new NullHandler();
        const canHandle = nullHandler.canHandle(message);
        const response = nullHandler.handle(message);

        expect(canHandle).toBe(true);
        expect(response).toEqual(null);
    });

    it("should not handle non-empty messages", () => {
        const nullHandler = new NullHandler();
        expect(nullHandler.canHandle({
            content: "(Global) Survivor: Hello, world!"
        })).toBe(false);
    });
});