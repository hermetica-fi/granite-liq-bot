import { describe, expect, test } from "bun:test";
import { makeBindings, makeSelectSql } from "./sql";

describe("dba sql", () => {
    test("makeSql basic", () => {
        expect(
            makeSelectSql({ fields: 'id, address, name, operator_balance', table: 'contracts', filters: [] })
        ).toEqual('SELECT id, address, name, operator_balance FROM contracts');
    });

    test("makeSql with filters", () => {
        expect(
            makeSelectSql({
                fields: 'id, address, name, operator_balance', table: 'contracts', filters: [
                    ['id', '>', 10],
                    ['name', '=', 'contract-name']
                ]
            })
        ).toEqual('SELECT id, address, name, operator_balance FROM contracts WHERE id > ? AND name = ?');
    });

    test("makeSql with filters and orderBy", () => {
        expect(
            makeSelectSql({
                fields: 'id, address, name, operator_balance', table: 'contracts', filters: [
                    ['id', '>', 10],
                    ['name', '=', 'contract-name']
                ],
                orderBy: 'id DESC',
            })
        ).toEqual('SELECT id, address, name, operator_balance FROM contracts WHERE id > ? AND name = ? ORDER BY id DESC');
    });

    test("makeSql with filters and orderBy and limit", () => {
        expect(
            makeSelectSql({
                fields: 'id, address, name, operator_balance', table: 'contracts', filters: [
                    ['id', '>', 10],
                    ['name', '=', 'contract-name']
                ],
                orderBy: 'id DESC',
                limit: 10
            })
        ).toEqual('SELECT id, address, name, operator_balance FROM contracts WHERE id > ? AND name = ? ORDER BY id DESC LIMIT 10');
    });

    test("makeBindings", () => {
        expect(
            makeBindings([
                ['id', '>', 10],
                ['name', '=', 'contract-name']
            ])
        ).toEqual([10, 'contract-name']);
    });

    test("makeBindings empty", () => {
        expect(
            makeBindings([])
        ).toEqual([]);
    });
});