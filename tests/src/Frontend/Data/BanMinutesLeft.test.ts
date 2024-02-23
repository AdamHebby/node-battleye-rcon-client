/**
 * @jest-environment jsdom
 */
import BanMinutesLeft from "../../../../src/Frontend/Data/BanMinutesLeft";

describe("BanMinutesLeft", () => {
    test("test minutes in data ", () => {
        const banMinutesLeft = new BanMinutesLeft(1);
        expect(banMinutesLeft.data?.toString().trim()).toBe('1m');
    })
    test("test hours in data ", () => {
        const banMinutesLeft = new BanMinutesLeft(64);
        expect(banMinutesLeft.data?.toString().trim()).toBe('1h 4m');
    })
    test("test large time in data ", () => {
        const banMinutesLeft = new BanMinutesLeft((60 * 24 * 365 * 2) + (60 * 24 * 2) + 122);
        expect(banMinutesLeft.data?.toString().trim()).toBe('2y 2d 2h 2m');
    })
});
