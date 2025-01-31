import { Router } from "@reach/router";
import { useEffect } from "react";
import "./App.css";
import useToast from "./hooks/use-toast";
import Layout from "./layout";
import Providers from "./providers";
import { useContractsStore } from "./store/contracts";
import BorrowersPage from "./views/borrowers";
import ContractPage from "./views/contract";
import HomePage from "./views/home";

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
          <BorrowersPage path="/borrowers" />  
          <BorrowersPage path="/borrowers/:network" />  
        </Router>
      </Layout>
    </Providers>
  );
}

export default App;
