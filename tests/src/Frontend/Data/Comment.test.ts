/**
 * @jest-environment jsdom
 */
import Comment from "../../../../src/Frontend/Data/Comment";

describe("Comment", () => {
    test("Test key", () => {
        let data = new Comment('comment');
        expect(Comment.key).toBe(data.key);
        expect(data.data).toBe('comment');
    });
});
