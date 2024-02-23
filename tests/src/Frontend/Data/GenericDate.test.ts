/**
 * @jest-environment jsdom
 */
import GenericDate from "../../../../src/Frontend/Data/GenericDate";

describe("GenericDate", () => {
    test("Test key", () => {
        let date = new Date();
        let data = new GenericDate(date, 'generic-date');
        expect('generic-date').toBe(data.key);
        expect(GenericDate.key).toBe('player-generic-date');
        expect(data.data).toBe(date.toUTCString());

        let element = data.jQuery();
        expect(element.text()).toBe(date.toUTCString());
        expect(element.attr('data-date')).toBe(date.toString());
    });
});
