import { atom } from 'jotai';
import { ContractState } from './types';

export const contractsAtom = atom<ContractState>({
    initialized: false,
    loading: false,
    list: []
});