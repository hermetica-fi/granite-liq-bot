import { Box, Typography } from "@mui/material";
import AddContractForm from "../../components/add-contract-form";
import { useContractsStore } from "../../store/contracts";
import { grey } from "@mui/material/colors";
import ThemedBox from "../../components/themed-box";
import useTranslation from "../../hooks/use-translation";

const Home = () => {
  const { contracts } = useContractsStore();
  const [t] = useTranslation();

  if (contracts.length === 0) {
    return (
      <Box sx={{ maxWidth: "600px" }}>
        <AddContractForm />
      </Box>
    );
  }

  return (
    <ThemedBox sx={{ maxWidth: "600px" }}>
      <Typography variant="h6">{t('Contracts')}</Typography>
      <Typography fontSize="small" sx={{ mb: "20px", color: grey[600] }}>
        {t('List of liquidation contracts you have added.')}
      </Typography>
    </ThemedBox>
  );
};

export default Home;
