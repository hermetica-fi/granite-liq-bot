import { Box, Typography } from "@mui/material";
import AddContractForm from "../../components/add-contract-form";
import { useContractsStore } from "../../store/contracts";
import { grey } from "@mui/material/colors";
import ThemedBox from "../../components/themed-box";

const Home = () => {
  const { contracts } = useContractsStore();

  if (contracts.length === 0) {
    return (
      <Box sx={{ maxWidth: "600px" }}>
        <AddContractForm />
      </Box>
    );
  }

  return (
    <ThemedBox sx={{ maxWidth: "600px" }}>
      <Typography variant="h6">Contracts</Typography>
      <Typography fontSize="small" sx={{ mb: "20px", color: grey[600] }}>
        List of liquidation contracts you have added.
      </Typography>
    </ThemedBox>
  );
};

export default Home;
