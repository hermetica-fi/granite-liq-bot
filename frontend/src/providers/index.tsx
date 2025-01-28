import React from "react";
import { Provider } from "jotai";

import ToastProvider from "./toast";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider>
      <ToastProvider>{children}</ToastProvider>
    </Provider>
  );
};

export default Providers;
