/// <reference types="vite/client" />
import { type LeatherProvider } from "@leather.io/rpc";

declare global {
  interface Window {
    LeatherProvider?: LeatherProvider;
    XverseProviders?: Record;
  }
}
