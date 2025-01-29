import { Box, Typography, useTheme } from "@mui/material";
import AddContractForm from "../../components/add-contract-form";
import { useContractsStore } from "../../store/contracts";
import { grey } from "@mui/material/colors";
import ThemedBox from "../../components/themed-box";
import useTranslation from "../../hooks/use-translation";
import NetworkChip from "../../components/network-chip";

const Home = () => {
  const { contracts } = useContractsStore();
  const [t] = useTranslation();
  const theme = useTheme();

  if (contracts.length === 0) {
    return (
      <Box sx={{ maxWidth: "600px" }}>
        <AddContractForm />
      </Box>
    );
  }

  return (
    <ThemedBox sx={{ maxWidth: "600px" }}>
      <Typography variant="h6">{t("Contracts")}</Typography>
      <Typography fontSize="small" sx={{ mb: "20px", color: grey[600] }}>
        {t("List of liquidation contracts you have added.")}
      </Typography>
      <Box>
        {contracts.map((c, n) => (
          <Box
            key={c.id}
            sx={{
              cursor: "pointer",
              padding: "6px",
              marginBottom: n === contracts.length - 1 ? null : "6px",
              borderRadius: "4px",
              bgcolor: theme.palette.mode === "light" ? grey[50] : grey[900],
              ":hover": {
                bgcolor: "transparent",
              },
            }}
            onClick={() => {}}
          >
            <Box
              sx={{
                mb: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography fontWeight="bold">{c.name}</Typography>
              <NetworkChip network={c.network} />
            </Box>
            <Box sx={{ overflowWrap: "break-word" }}>
              <Typography fontSize="90%" color={grey[600]}>
                {c.address}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </ThemedBox>
  );
};

export default Home;
