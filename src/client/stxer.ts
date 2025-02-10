export type ReadCall = [string, string, ...string[]];
export type CallResult = {Ok?: string, Err?: string};

export const batchContractRead = async (calls: ReadCall[]): Promise<CallResult[]> => {
    return await fetch('https://api.stxer.xyz/sidecar/v2/batch', {
        method: 'POST',
        body: JSON.stringify({
            readonly: calls
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(r => r.json()).then(r => r.readonly);
}

