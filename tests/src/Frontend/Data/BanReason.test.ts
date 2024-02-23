/**
 * @jest-environment jsdom
 */
import BanReason from "../../../../src/Frontend/Data/BanReason";

describe("BanReason", () => {
    test("Test key", () => {
        let data = new BanReason('Reason');
        expect(BanReason.key).toBe(data.key);
        expect(data.data).toBe('Reason');
    });
});
