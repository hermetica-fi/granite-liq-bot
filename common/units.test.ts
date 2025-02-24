import { expect, test } from "bun:test";
import { formatUnits, parseUnits, toFixedDown, toFixedHalfDown } from "./units";

test("formatUnits", () => {
    expect(formatUnits(124000000, 6)).toEqual(124);
    expect(formatUnits(124, 6)).toEqual(0.000124);
    expect(formatUnits(124820000, 8)).toEqual(1.2482);
})

test("parseUnits", () => {
    expect(parseUnits("124", 6)).toEqual(124000000);
    expect(parseUnits("124", 8)).toEqual(12400000000);
    expect(parseUnits("1.2482", 8)).toEqual(124820000);
})

test("toFixedHalfDown", () => {
    expect(toFixedHalfDown(124.821123, 2)).toEqual(124.82);
    expect(toFixedHalfDown(124.824123, 2)).toEqual(124.82);
    expect(toFixedHalfDown(124.825123, 2)).toEqual(124.83);
})

test("toFixedDown", () => {
    expect(toFixedDown(124.821123, 2)).toEqual(124.82);
    expect(toFixedDown(124.824123, 2)).toEqual(124.82);
    expect(toFixedDown(124.825123, 2)).toEqual(124.82);
})