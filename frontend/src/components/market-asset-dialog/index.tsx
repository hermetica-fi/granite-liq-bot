import { Box, TextField } from "@mui/material";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useState } from "react";
import useTranslation from "../../hooks/use-translation";
import { useModalStore } from "../../store/ui";
import CloseModal from "../close-modal";

const ManageAssetDialog = () => {
  const [t] = useTranslation();
  const { setModal } = useModalStore();
  const [asset, setAsset] = useState("");

  const handleClose = () => {
    setModal(null);
  };

  const handleSave = () => {
    setModal(null);
  };

  const handleAssetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAsset(e.target.value);
  };

  return (
    <>
      <DialogTitle>
        {t("Manage Market Assets")}
        <CloseModal onClick={handleClose} />
      </DialogTitle>
      <DialogContent>
        <Box sx={{ p: "10px 0" }}>
          <TextField
            fullWidth
            label={t("Asset address")}
            value={asset}
            onChange={handleAssetChange}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave}>{t("Set")}</Button>
      </DialogActions>
    </>
  );
};

export default ManageAssetDialog;
