import Dialog from '@mui/material/Dialog';
import React from 'react';
import { useModalStore } from '../store/ui';


const ModalProvider  = ({ children }: { children: React.ReactNode }) => {
    const { modal } = useModalStore();
    return <>
        {children}
        {modal && (
            <Dialog
                open={true}
                fullWidth
                fullScreen={modal.fullScreen || false}
                disableEscapeKeyDown={false}
            >
                {modal.body}
            </Dialog>
        )}
    </>;
}

export default ModalProvider;