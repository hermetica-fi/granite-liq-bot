import { useAtom } from "jotai";
import { contractsAtom } from "./state/contracts";
import { fetchContracts } from "./api";

export const useContracts = () => {
    const [contracts, setContracts] = useAtom(contractsAtom);

    const loadContracts = async () => {
        if (contracts.loading) return;

        setContracts(prev => ({ ...prev, loading: true, initialized: true }));

        try {
            const data = await fetchContracts();
            setContracts(prev => ({ ...prev, list: data, loading: false }));
        } catch (error) {
            console.error(error);
            setContracts(prev => ({ ...prev, loading: false }));
        }
    }

    return { contracts, loadContracts };
}