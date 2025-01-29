
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8081';

const wrapResponse = (resp: Promise<Response>) => resp.then(r => r.json()).then(r => {
    if (r.error) {
        throw new Error(r.error);
    }
    return r;
})

export const fetchContracts = () => wrapResponse(fetch(`${API_BASE}/contracts`));

export const postAddContract = (address: string, mnemonic: string) => wrapResponse(fetch(`${API_BASE}/add-contract`, {
    method: 'POST',
    body: JSON.stringify({ address, mnemonic })
}))