import { useEffect } from "react";
import { Router } from "@reach/router";
import Layout from "./layout";
import HomePage from "./views/home";
import "./App.css";
import Providers from "./providers";
import { useContractsStore } from "./store/contracts";
import useToast from "./hooks/use-toast";
import ContractPage from "./views/contract";

function App() {
  const {
    initialized,
    loading: contractsLoading,
    loadContracts,
  } = useContractsStore();
  const [showMessage] = useToast();

  useEffect(() => {
    if (!initialized) {
      loadContracts().catch((error) => {
        showMessage(error.message, "error");
      });
    }
  }, [loadContracts, initialized, showMessage]);

  const loading = contractsLoading || !initialized;

  if (loading) {
    return null;
  }

  return (
    <Providers>
      <Layout>
        <Router
          style={{ flexGrow: 1, display: "flex", flexDirection: "column"}}
        >
          <HomePage path="/" />
          <ContractPage path="/contract/:id" />
        </Router>
      </Layout>
    </Providers>
  );
}

export default App;
