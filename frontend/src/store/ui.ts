import { create } from 'zustand';
import { Modal, ModalState, ToastState, ToastType } from '../types';

export const useToastStore = create<ToastState>((set) => ({
    message: null, 
    type: null,
    setToast: (message: null | string, type: ToastType) => {
        set({ message, type });
    }
}));

export const useModalStore = create<ModalState>((set) => ({
    modal: null,
    setModal: (modal: Modal | null) => {
        set({ modal });
    }   
}));