import { expect, test } from "bun:test";
import path from "path";
import { getLiquidatedPrincipals } from "./lib";

test("getLiquidatedPrincipals", async () => {
    const tx = await Bun.file(path.join(__dirname, "test/0xaf2a0db5c813f51b4d8645ac54d8e8acd2aa5e00fe09ca92522d9fd12efe6d66.json")).json();
    const principals = getLiquidatedPrincipals(tx);
    expect(principals).toEqual(["SP3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBPEKAEK7", "SP1GJSC4GG3MDA1KYZJYS9FEVCKHASR1N7089BEQK"]);
});

test("getLiquidatedPrincipals", async () => {
    const tx = await Bun.file(path.join(__dirname, "test/0x55f13e394a220c7bb986e680672c2c433809961106efdae9f7d5c107d67f9629.json")).json();
    const principals = getLiquidatedPrincipals(tx);
    expect(principals).toEqual(["SP3XD84X3PE79SHJAZCDW1V5E9EA8JSKRBPEKAEK7"]);
});

