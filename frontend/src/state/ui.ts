import { create } from 'zustand';

export type ToastType = null | 'error' | 'warning' | 'info' | 'success';

export interface ToastState {
    message: null | string,
    type: ToastType,
    setToast: (message: null | string, type: ToastType) => void,
}

export const useToastStore = create<ToastState>((set) => ({
    message: null, 
    type: null,
    setToast: (message: null | string, type: ToastType) => {
        set({ message, type });
    }
}));