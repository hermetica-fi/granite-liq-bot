import { Box, Typography, TextField, Button } from "@mui/material";
import { useState } from "react";
import ThemedBox from "../themed-box";
import { useContracts } from "../../hooks/use-contracts";

const AddContractForm = () => {
  const [contractAddress, setContractAddress] = useState("");
  const [contractOwnerSecretKey, setContractOwnerSecretKey] = useState("");
  const [inProgress, setInProgress] = useState(false);
  const { addContract } = useContracts();   

  const handleSubmit = async () => {
    setInProgress(true);
    try {
      await addContract(contractAddress, contractOwnerSecretKey);
    } catch (error) {
      console.error(error);
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
      <Typography variant="h5">Add Liqudiation Contract</Typography>
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
        <Button variant="contained" onClick={handleSubmit} disabled={inProgress}>
          Submit
        </Button>
      </Box>
    </ThemedBox>
  );
};

export default AddContractForm;
