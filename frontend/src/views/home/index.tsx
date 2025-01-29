import { Box } from "@mui/material";
import AddContractForm from "../../components/add-contract-form";
import { useContractsStore } from "../../store/contracts";
import ContractList from "../../components/contract-list";

const Home = () => {
  const { contracts } = useContractsStore();
  if (contracts.length === 0) {
    return (
      <Box sx={{ maxWidth: "600px" }}>
        <AddContractForm />
      </Box>
    );
  }

  return  <ContractList contracts={contracts} />;
};

export default Home;
