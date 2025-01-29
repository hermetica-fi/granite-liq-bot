import { useEffect } from "react";
import Layout from "./layout";
import HomePage from "./views/home";
import "./App.css";
import Providers from "./providers";
import { useContractsStore } from "./store/contracts";

function App() {
  const { initialized, loadContracts } = useContractsStore();
 
  useEffect(() => {
    if (!initialized) {
      loadContracts();
    }
  }, [loadContracts, initialized]);

  return (
    <Providers>
      <Layout>
        <HomePage />
      </Layout>
    </Providers>
  );
}

export default App;
