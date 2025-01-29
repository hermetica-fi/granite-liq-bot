import { create } from 'zustand';
import { ToastState, ToastType } from '../types';

export const useToastStore = create<ToastState>((set) => ({
    message: null, 
    type: null,
    setToast: (message: null | string, type: ToastType) => {
        set({ message, type });
    }
}));