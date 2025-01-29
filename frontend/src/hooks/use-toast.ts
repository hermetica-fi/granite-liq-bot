import { useRef } from 'react';
import { useToastStore } from '../store/ui';
import { ToastType } from '../types';

const useToast = (): [(message: string, type: ToastType, timeout?: number) => void, () => void] => {
    const { setToast } = useToastStore();
    const timer = useRef<number>();

    const hideMessage = () => {
        setToast(null, null);
    }

    const showMessage = (message: string, type: ToastType, timeout: number = 5000) => {
        window.clearTimeout(timer.current);

        setToast(message, type);

        timer.current = window.setTimeout(() => {
            hideMessage();
        }, timeout);
    };

    return [showMessage, hideMessage]
}

export default useToast;