/**
 * @jest-environment jsdom
 */
import Generic from "../../../../src/Frontend/Data/Generic";

describe("Generic", () => {
    test("Test key", () => {
        let data = new Generic('Generic', 'generic-key');
        // expect(Generic.key).toBe(data.key); // TODO: Fix this
        expect(data.data).toBe('Generic');
    });
});
