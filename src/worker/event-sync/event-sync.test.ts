import { describe, expect, test } from "bun:test";
import { getContractsToTrack } from "../event-sync";

describe("getContractsToTrack", () => {
    test("initial sync true and not in staging", () => {
        expect(getContractsToTrack(true, false).indexOf("SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA.borrower-v1") > -1).toBe(true);
        expect(getContractsToTrack(true, false).indexOf("SP3BJR4P3W2Y9G22HA595Z59VHBC9EQYRFWSKG743.borrower-v1") > -1).toBe(true);
    });

    test("initial sync false and not in staging", () => {
        expect(getContractsToTrack(false, false).indexOf("SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA.borrower-v1") === -1).toBe(true);
        expect(getContractsToTrack(false, false).indexOf("SP3BJR4P3W2Y9G22HA595Z59VHBC9EQYRFWSKG743.borrower-v1") === -1).toBe(true);
    });

    test("initial sync true and in staging", () => {
        expect(getContractsToTrack(true, true).indexOf("SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA.borrower-v1") === -1).toBe(true);
        expect(getContractsToTrack(true, true).indexOf("SP3BJR4P3W2Y9G22HA595Z59VHBC9EQYRFWSKG743.borrower-v1") === -1).toBe(true);
    });
});

