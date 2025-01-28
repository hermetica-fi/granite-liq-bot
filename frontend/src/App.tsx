import { useContracts } from "./hooks/use-contracts";
import { useEffect } from "react";
import Layout from "./layout";
import HomePage from "./views/home";
import "./App.css";
import Providers from "./providers";

function App() {
  const { contracts, loadContracts } = useContracts();

  useEffect(() => {
    if (!contracts.initialized) {
      const timer = setTimeout(loadContracts);
      return () => clearTimeout(timer);
    }
  }, [contracts.initialized, loadContracts]);

  const loading = contracts.loading || !contracts.initialized;

  if (loading) return null;

  return (
    <Providers>
      <Layout>
        <HomePage />
      </Layout>
    </Providers>
  );
}

export default App;
