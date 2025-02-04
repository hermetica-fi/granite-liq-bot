import { Router } from "@reach/router";
import { useEffect } from "react";
import "./App.css";
import useToast from "./hooks/use-toast";
import Layout from "./layout";
import Providers from "./providers";
import { useContractsListStore } from "./store/contracts-list";
import ContractPage from "./views/contract";
import HomePage from "./views/home";

function App() {
  const {
    initialized,
    loading: contractsLoading,
    loadContracts,
  } = useContractsListStore();
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
