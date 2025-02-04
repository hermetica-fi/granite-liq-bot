import { Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import useToast from "../../hooks/use-toast";
import useTranslation from "../../hooks/use-translation";
import { useContractsListStore } from "../../store/contracts-list";
import ThemedBox from "../themed-box";

const AddContractForm = () => {
  const [t] = useTranslation();
  const [contractAddress, setContractAddress] = useState("");
  const [contractOperatorSecretKey, setContractOperatorSecretKey] = useState("");
  const [inProgress, setInProgress] = useState(false);

  const [showMessage] = useToast();

  const { addContract } = useContractsListStore()

  const handleSubmit = async () => {
    setInProgress(true);
    try {
      await addContract(contractAddress, contractOperatorSecretKey);
    } catch (error) {
      if (error instanceof Error) {
        showMessage(error.message, "error");
      } else {
        showMessage("An unknown error occurred", "error");
      }
    }
    setInProgress(false);
  };

  const handleContractAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setContractAddress(e.target.value);
  };

  const handleContractOperatorSecretKeyChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setContractOperatorSecretKey(e.target.value);
  };

  return (
    <ThemedBox>
      <Typography variant="h5" sx={{ mb: "20px" }}>
        {t("Add Liqudiation Contract")}
      </Typography>
      <Box sx={{ mb: "12px", mt: "12px" }}>
        <TextField
          label="Contract Address"
          autoComplete="off"
          fullWidth
          helperText="e.g ST36B2A32N1WCRSV1437QR8ET917ZHYVY7J3K1AM0.liquidator"
          value={contractAddress}
          onChange={handleContractAddressChange}
        />
      </Box>
      <Box sx={{ mb: "12px", mt: "12px" }}>
        <TextField
          label={t("Contract Operator Secret Key")}
          fullWidth
          helperText="24 word mnemonic"
          value={contractOperatorSecretKey}
          onChange={handleContractOperatorSecretKeyChange}
        />
      </Box>
      <Box>
        <Button
          variant="contained"
          role="button"
          onClick={handleSubmit}
          disabled={inProgress}
        >
          {t("Submit")}
        </Button>
      </Box>
    </ThemedBox>
  );
};

export default AddContractForm;
