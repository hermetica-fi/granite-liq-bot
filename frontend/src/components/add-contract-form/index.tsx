import { Box, Typography, TextField, Button } from "@mui/material";
import ThemedBox from "../themed-box";

const AddContractForm = () => {
  return (
    <ThemedBox>
      <Typography variant="h5">Link Liqudiation Contract</Typography>
      <Box component="p">
        <TextField label="Contract Address" fullWidth  helperText="e.g ST36B2A32N1WCRSV1437QR8ET917ZHYVY7J3K1AM0.liquidator"/>
      </Box>
      <Box component="p">
        <TextField label="Contract Owner Secret Key" fullWidth helperText="24 word mnemonic" />
      </Box>
      <Box component="p">
        <Button variant="contained">Submit</Button>
      </Box>
    </ThemedBox>
  );
};

export default AddContractForm;
