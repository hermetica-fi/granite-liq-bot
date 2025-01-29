import React from "react";

import ToastProvider from "./toast";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ToastProvider>{children}</ToastProvider>
  );
};

export default Providers;
