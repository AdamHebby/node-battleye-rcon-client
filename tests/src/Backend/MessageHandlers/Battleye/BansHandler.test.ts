import BansHandler from "../../../../../src/Backend/MessageHandlers/Battleye/BansHandler";
import Ban from "../../../../../src/Models/Ban";
import ServerEvents from "../../../../../src/ServerEvents";

describe("BansHandler", () => {
    it("should handle ban info messages", () => {
        const message = {
            content: "GUID Bans:\n" +
            "[#] [GUID] [Minutes left] [Reason]\n" +
            "----------------------------------------\n" +
            "0  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa 60   Some Reason a\n" +
            "1  bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb perm Some Reason b\n" +
            "2  cccccccccccccccccccccccccccccccc 127  Some Reason c\n" +
            "3  dddddddddddddddddddddddddddddddd perm Some Reason d\n" +
            "\n" +
            "IP Bans:\n" +
            "[#] [IP Address] [Minutes left] [Reason]\n" +
            "----------------------------------------------\n" +
            "4  192.168.0.1:1871    60   Some Reason\n" +
            "5  169.254.120.51:8347 perm Some Reason\n" +
            "6  233.252.85.56:52711 54   Some Reason"
        };

        const bansHandler = new BansHandler();

        const canHandle = bansHandler.canHandle(message);
        const response = bansHandler.handle(message);

        let expectedBans = [
            new Ban(0, null, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 60, 'Some Reason a'),
            new Ban(1, null, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', -1, 'Some Reason b'),
            new Ban(2, null, 'cccccccccccccccccccccccccccccccc', 127, 'Some Reason c'),
            new Ban(3, null, 'dddddddddddddddddddddddddddddddd', -1, 'Some Reason d'),
            new Ban(4, '192.168.0.1:1871', null, 60, 'Some Reason'),
            new Ban(5, '169.254.120.51:8347', null, -1, 'Some Reason'),
            new Ban(6, '233.252.85.56:52711', null, 54, 'Some Reason'),
        ];

        expect(canHandle).toBe(true);

        expect(response.type).toBe(ServerEvents.BANS);
        expect(response.data.length).toBe(expectedBans.length);

        for (let i = 0; i < response.data.length; i++) {
            expect(response.data[i].toJson()).toEqual(expectedBans[i].toJson());
        }
    });

    it("should not handle non-ban info messages", () => {
        const bansHandler = new BansHandler();

        expect(bansHandler.canHandle({
            content: "RCon admin #14 (192.168.0.1) logged in"
        })).toBe(false);

        expect(bansHandler.canHandle({
            content: "(Global) Survivor: Connected RCon admins:"
        })).toBe(false);

        expect(bansHandler.canHandle({
            content: "(Global) Survivor: RCon admin #14 (192.168.0.1) logged out"
        })).toBe(false);

        expect(bansHandler.canHandle({
            content: "RCon admin #1: (Global) RCon admin #14 (192.168.0.1) logged out"
        })).toBe(false);
    });
});
