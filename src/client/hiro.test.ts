import { expect, setSystemTime, test } from "bun:test";
import { shouldUseHiroApiKey } from "./hiro";

test("shouldUseHiroApiKey", () => {
    setSystemTime(1753789502000);

    for (let x = 0; x < 9; x++) {
        expect(shouldUseHiroApiKey()).toBe(false);
        setSystemTime(Date.now() + 1000);
    }

    setSystemTime(Date.now() + 1000);
    expect(shouldUseHiroApiKey()).toBe(true);

    setSystemTime(Date.now() + 13000);
    expect(shouldUseHiroApiKey()).toBe(false);
    expect(shouldUseHiroApiKey()).toBe(false);
    expect(shouldUseHiroApiKey()).toBe(true);

    setSystemTime(Date.now() + 10000);
    for (let x = 0; x < 6; x++) {
        expect(shouldUseHiroApiKey()).toBe(false);
    }
    
    expect(shouldUseHiroApiKey()).toBe(true);
});

