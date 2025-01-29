
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8081';

const postResponseWrapper = (resp: Promise<Response>) => resp.then(r => r.json()).then(r => {
    if (r.error) {
        throw new Error(r.error);
    }
    return r;
})

export const fetchContracts = () => fetch(`${API_BASE}/contracts`).then(r => r.json());

export const postAddContract = (address: string, mnemonic: string) => postResponseWrapper(fetch(`${API_BASE}/add-contract`, {
    method: 'POST',
    body: JSON.stringify({ address, mnemonic })
}))