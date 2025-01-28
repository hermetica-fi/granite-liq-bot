import {useRef} from 'react';
import {useAtom} from 'jotai';
import {toastAtom, Toast, ToastType} from '../state/ui';


const useToast = (): [Toast, (message: string, type: ToastType, timeout?: number) => void, () => void] => {
    const [toast, setToast] = useAtom(toastAtom);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const timer = useRef<any>();

    const hideMessage = () => {
        setToast({message: null, type: null});
    }

    const showMessage = (message: string, type: ToastType, timeout: number = 5000) => {
        clearTimeout(timer.current);

        setToast({message, type});

        timer.current = setTimeout(() => {
            hideMessage();
        }, timeout);
    };

    return [toast, showMessage, hideMessage]
}

export default useToast;