import { Box, Typography, TextField, Button } from "@mui/material";
import { useState } from "react";
import ThemedBox from "../themed-box";
import useToast from "../../hooks/use-toast";
import { useContractsStore } from "../../state/contracts";

const AddContractForm = () => {
  const [contractAddress, setContractAddress] = useState("");
  const [contractOwnerSecretKey, setContractOwnerSecretKey] = useState("");
  const [inProgress, setInProgress] = useState(false);

  const [, showMessage] = useToast();

  const { addContract } = useContractsStore()

  const handleSubmit = async () => {
    setInProgress(true);
    try {
      await addContract(contractAddress, contractOwnerSecretKey);
    } catch (error: unknown) {
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

  const handleContractOwnerSecretKeyChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setContractOwnerSecretKey(e.target.value);
  };

  return (
    <ThemedBox>
      <Typography variant="h5" sx={{ mb: "20px" }}>
        Add Liqudiation Contract
      </Typography>
      <Box sx={{ mb: "12px", mt: "12px" }}>
        <TextField
          label="Contract Address"
          fullWidth
          helperText="e.g ST36B2A32N1WCRSV1437QR8ET917ZHYVY7J3K1AM0.liquidator"
          value={contractAddress}
          onChange={handleContractAddressChange}
        />
      </Box>
      <Box sx={{ mb: "12px", mt: "12px" }}>
        <TextField
          label="Contract Owner Secret Key"
          fullWidth
          helperText="24 word mnemonic"
          value={contractOwnerSecretKey}
          onChange={handleContractOwnerSecretKeyChange}
        />
      </Box>
      <Box>
        <Button
          variant="contained"
          role="button"
          onClick={handleSubmit}
          disabled={inProgress}
        >
          Submit
        </Button>
      </Box>
    </ThemedBox>
  );
};

export default AddContractForm;
