import { Button } from "@mui/material";
import { useContracts } from "./hooks";
import { useEffect } from "react";

function App() {
  const {contracts, loadContracts } = useContracts();
  
  useEffect(() => {
    if (!contracts.initialized) {
      const timer = setTimeout(loadContracts);
      return () => clearTimeout(timer); 
    }
  }, [contracts.initialized, loadContracts]);

  return (
    <>
      <Button variant="contained">Hello World</Button>
    </>
  );
}

export default App;
