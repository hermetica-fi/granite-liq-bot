/// <reference types="vite/client" />
import { LeatherProvider } from "@leather.io/rpc";

declare global {
  interface Window {
    LeatherProvider?: LeatherProvider;
  }
}
