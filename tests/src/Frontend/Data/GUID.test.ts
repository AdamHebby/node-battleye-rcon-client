/**
 * @jest-environment jsdom
 */
import GUID from "../../../../src/Frontend/Data/GUID";

describe("GUID", () => {
    test("Test key", () => {
        let data = new GUID('GUID');
        expect(GUID.key).toBe(data.key);
        expect(data.data).toBe('GUID');
    });
});
