import React from "react";

import ModalProvider from "./modal";
import ToastProvider from "./toast";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ModalProvider>
      <ToastProvider>{children}</ToastProvider>
    </ModalProvider>
  );
};

export default Providers;
