/**
 * @jest-environment jsdom
 */
import IpAddress from "../../../../src/Frontend/Data/IpAddress";

describe("IpAddress", () => {
    test("Test key", () => {
        let data = new IpAddress('192.168.0.1:1234');
        expect(IpAddress.key).toBe(data.key);
        expect(data.data).toBe('192.168.0.1:1234');
    });
});
