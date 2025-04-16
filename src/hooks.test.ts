import { describe, expect, setSystemTime, test } from "bun:test";
import { clearMessageCache, MESSAGE_CACHE, MESSAGE_EXPIRES, onExit, onStart } from "./hooks";

describe("hooks", () => {
    test("message cache", () => {
        const NOW = 1744112840587;
        setSystemTime(NOW);

        const cache = MESSAGE_CACHE;
        expect(cache).toEqual({});
        onStart();

        expect(cache).toEqual({
            "3739654311402460775": 1744112900587,
        });

        setSystemTime(NOW + (MESSAGE_EXPIRES / 2))
        onExit();
        clearMessageCache();
        expect(cache).toEqual({
            "3739654311402460775": 1744112900587,
            "11398607655464196380": 1744112930587,
        });

        setSystemTime(NOW + MESSAGE_EXPIRES);
        clearMessageCache();

        expect(cache).toEqual({
            "3739654311402460775": 0,
            "11398607655464196380": 1744112930587,
        });

        onStart();
        expect(cache).toEqual({
            "3739654311402460775": 1744112960587,
            "11398607655464196380": 1744112930587,
        });
    });
});

