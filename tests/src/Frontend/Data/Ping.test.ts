/**
 * @jest-environment jsdom
 */
import Ping from "../../../../src/Frontend/Data/Ping";

describe("Ping", () => {
    test("Test key", () => {
        let data = new Ping(31);
        expect(Ping.key).toBe(data.key);
        expect(data.data).toBe(31);
    });
});
