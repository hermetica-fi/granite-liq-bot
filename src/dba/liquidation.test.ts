import { describe, expect, setSystemTime, test } from "bun:test";
import { dbCon } from "../db/con";
import { finalizeLiquidation, insertLiquidation } from "./liquidation";

describe("dba contracts", () => {
    test("insertLiquidation", () => {
        setSystemTime(1738262052565);
        insertLiquidation('0x00', 'SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator');

        const r = dbCon.prepare('SELECT * FROM liquidation WHERE txid=?', ['0x00']).get();
        expect(r).toEqual({
            txid: "0x00",
            contract: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator",
            status: "pending",
            created_at: 1738262052,
            updated_at: null,
        })
    });

    test("finalizeLiquidation", () => {
        setSystemTime(1738262062585);
        finalizeLiquidation('0x00', 'success');
        const r = dbCon.prepare('SELECT * FROM liquidation WHERE txid=?', ['0x00']).get();
        expect(r).toEqual({
            txid: "0x00",
            contract: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator",
            status: "success",
            created_at: 1738262052,
            updated_at: 1738262062,
        });
    });
});
