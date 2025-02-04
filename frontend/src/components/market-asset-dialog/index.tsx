import { Box, Link, TextField, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { transactionLink } from "granite-liq-bot-common";
import { useMemo, useState } from "react";
import { setContractValue } from "../../api";
import useToast from "../../hooks/use-toast";
import useTranslation from "../../hooks/use-translation";
import { useContractStore } from "../../store/contract";
import { useModalStore } from "../../store/ui";
import CloseModal from "../close-modal";

const ManageAssetDialog = () => {
  const store = useContractStore();
  const contract = store.data!;
  const [t] = useTranslation();
  const { setModal } = useModalStore();
  const [assetId, setAssetId] = useState("");
  const [inProgress, setInProgress] = useState(false);
  const [showMessage] = useToast();
  const [txid, setTxid] = useState(null);

  const handleClose = () => {
    setModal(null);
  };

  const handleSubmit = async () => {
    if (assetId.trim() === "") {
      if (!confirm(t("This is going to reset market asset. Are you sure?"))) {
        return;
      }
    }

    setInProgress(true);
    try {
      const { txid } = await setContractValue(
        contract.id,
        "set-market-assets",
        assetId
      );

      setTxid(txid);
    } catch (error) {
      if (error instanceof Error) {
        showMessage(error.message, "error");
      } else {
        showMessage("An unknown error occurred", "error");
      }
    }
    setInProgress(false);
  };

  const handleAssetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAssetId(e.target.value);
  };

  const txLink = useMemo(() => {
    return txid ? transactionLink(txid, contract.network) : "";
  }, [txid, contract.network]);

  return (
    <>
      <DialogTitle>
        {t("Set Market Asset")}
        <CloseModal onClick={handleClose} />
      </DialogTitle>
      <DialogContent>
        <Box sx={{ p: "10px 0" }}>
          {txid ? (
            <Box sx={{ wordBreak: "break-word" }}>
              <Typography>
                {t("A transaction successfully sent to update state:")}
              </Typography>
              <Typography sx={{ fontSize: "90%" }}>
                <Link href={txLink} target="_blank" rel="noopener noreferrer">
                  {txid}
                </Link>
              </Typography>
            </Box>
          ) : (
            <TextField
              fullWidth
              label={t("Asset address")}
              value={assetId}
              autoComplete="off"
              helperText={t(
                "e.g. SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc"
              )}
              onChange={handleAssetChange}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {txid ? (
          <Button onClick={handleClose}>{t("Close")}</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={inProgress}>
            {t("Submit")}
          </Button>
        )}
      </DialogActions>
    </>
  );
};

export default ManageAssetDialog;
