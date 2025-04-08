import { describe, expect, setSystemTime, test } from "bun:test";
import { clearMessageCache, MESSAGE_CACHE, onExit, onStart } from "./hooks";

describe("hooks", () => {
    test("message cache", () => {
        const NOW = 1744112840587;
        setSystemTime(NOW);

        const cache = MESSAGE_CACHE;
        expect(cache).toEqual({});
        onStart();

        expect(cache).toEqual({
            "9021218387891534663": 1744112900587,
        });

        setSystemTime(NOW + 30_000)
        onExit();
        clearMessageCache();
        expect(cache).toEqual({
            "9021218387891534663": 1744112900587,
            "7628909569708515819": 1744112930587,
        });

        setSystemTime(NOW + 60_000);
        clearMessageCache();

        expect(cache).toEqual({
            "9021218387891534663": 0,
            "7628909569708515819": 1744112930587,
        });

        onStart();
        expect(cache).toEqual({
            "9021218387891534663": 1744112960587,
            "7628909569708515819": 1744112930587,
        });
    });
});

