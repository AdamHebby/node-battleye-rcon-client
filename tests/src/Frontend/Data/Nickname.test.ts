/**
 * @jest-environment jsdom
 */
import Nickname from "../../../../src/Frontend/Data/Nickname";

describe("Nickname", () => {
    test("Test key", () => {
        let data = new Nickname('Nickname');
        expect(Nickname.key).toBe(data.key);
        expect(data.data).toBe('Nickname');
    });
});
