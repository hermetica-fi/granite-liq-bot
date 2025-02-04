import { Box, Link, TextField, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { transactionLink } from "granite-liq-bot-common";
import { useMemo, useState } from "react";
import { setMarketAsset } from "../../api";
import useToast from "../../hooks/use-toast";
import useTranslation from "../../hooks/use-translation";
import { useModalStore } from "../../store/ui";
import { Contract } from "../../types";
import CloseModal from "../close-modal";

const ManageAssetDialog = ({ contract }: { contract: Contract }) => {
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
      const { txid } = await setMarketAsset(assetId, contract.id);

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
                {t(
                  "A transaction successfully sent to update the market asset:"
                )}
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
