import { useContracts } from "./hooks";
import { useEffect } from "react";
import ContractsPage from "./pages/Contracts";
import Layout from "./Layout";
import "./App.css";

function App() {
  const {contracts, loadContracts } = useContracts();

  useEffect(() => {
    if (!contracts.initialized) {
      const timer = setTimeout(loadContracts);
      return () => clearTimeout(timer); 
    }
  }, [contracts.initialized, loadContracts]);

  const loading = contracts.loading || !contracts.initialized;

  if(loading) return null;

  return (
    <Layout>
      <ContractsPage />
    </Layout>
  );
}

export default App;
