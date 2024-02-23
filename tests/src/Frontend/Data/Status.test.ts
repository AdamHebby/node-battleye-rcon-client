/**
 * @jest-environment jsdom
 */
import Status from "../../../../src/Frontend/Data/Status";

describe("Status", () => {
    test("Test key", () => {
        let data = new Status('Status');
        expect(Status.key).toBe(data.key);
        expect(data.data).toBe('Status');
    });
});
