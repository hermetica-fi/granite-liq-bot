
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8081';

export const fetchContracts = () => fetch(`${API_BASE}/contracts`).then(r => r.json())

export const addContract = (address: string, mnemonic: string) => fetch(`${API_BASE}/add-contract`, {
    method: 'POST',
    body: JSON.stringify({ address, mnemonic })
}).then(r => r.json())