import assert from "node:assert";


export const assertEnvVar = (key: string, def?: any) => {
    if (process.env[key] === undefined && def) {
        return def;
    }

    assert(process.env[key] !== undefined, `${key} env var is required`);

    return process.env[key];
}

export const assertNumericEnvVar = (key: string, def?: number) => {
    const isNumericStr = (value: string) => {
        return /^-?\d+$/.test(value);
    }

    if (process.env[key] === undefined && def) {
        return def;
    }

    assert(process.env[key] !== undefined, `${key} env var is required`);
    assert(isNumericStr(process.env[key]), `${key} must be a number`);
    return Number(process.env[key]);
}

export const epoch = () => Math.floor(Date.now() / 1000);