import { useAtom } from "jotai";
import { contractsAtom } from "./state";
import { fetchContracts } from "./api";

export const useContracts = () => {
    const [contracts, setContracts] = useAtom(contractsAtom);

    const loadContracts = async () => {
        if (!contracts.loading) {
            setContracts({ ...contracts, loading: true });

            fetchContracts().then(data => {
                setContracts({ ...contracts, contracts: data, loading: false });
            }).catch(() => {
                setContracts({ ...contracts, loading: false });
            });
        }
    }

    return { loadContracts };
}