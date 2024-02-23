/**
 * @jest-environment jsdom
 */
import Name from "../../../../src/Frontend/Data/Name";

describe("Name", () => {
    test("Test key", () => {
        let data = new Name('Name');
        expect(Name.key).toBe(data.key);
        expect(data.data).toBe('Name');
    });
});
