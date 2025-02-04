import { LeatherProvider } from "@leather.io/rpc";
import { Box, Link, TextField, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import {
  broadcastTransaction,
  ContractIdString,
  contractPrincipalCV,
  deserializeTransaction,
  makeUnsignedContractCall,
  Pc,
  uintCV,
} from "@stacks/transactions";
import {
  parseUnits,
  TESTNET_FEE,
  transactionLink,
} from "granite-liq-bot-common";
import { useCallback, useMemo, useState } from "react";
import useToast from "../../hooks/use-toast";
import useTranslation from "../../hooks/use-translation";
import { useContractStore } from "../../store/contract";
import { useModalStore } from "../../store/ui";
import CloseModal from "../close-modal";

const DepositDialog = () => {
  const store = useContractStore();
  const contract = store.data!;
  const [t] = useTranslation();
  const { setModal } = useModalStore();
  const [showMessage] = useToast();
  const [connection, setConnection] = useState<{
    address: string;
    publicKey: string;
  } | null>(null);
  const [txid, setTxid] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [inProgress] = useState(false);

  const handleClose = () => {
    setModal(null);
  };

  const handleSubmit = useCallback(async () => {
    if (!window.LeatherProvider) {
      showMessage("Leather Provider not found", "error");
      return;
    }

    let address;
    let publicKey;

    if (!connection) {
      const response = await window.LeatherProvider?.request("getAddresses");
      if (!response) {
        return;
      }

      const { addresses } = response.result;
      address = addresses.find((address) => address.symbol === "STX")!.address;
      publicKey = addresses.find(
        (address) => address.symbol === "STX"
      )!.publicKey;

      setConnection({ address, publicKey });
    } else {
      address = connection.address;
      publicKey = connection.publicKey;
    }

    const marketAsset = contract.marketAsset!;
    const amount = parseUnits(amountRaw, marketAsset.decimals);
    const txOptions = {
      contractAddress: contract.address,
      contractName: contract.name,
      functionName: "deposit",
      functionArgs: [
        contractPrincipalCV(
          marketAsset.address.split(".")[0],
          marketAsset.address.split(".")[1]
        ),
        uintCV(amount),
      ],
      network: contract.network,
      publicKey,
      fee: contract.network === "testnet" ? TESTNET_FEE : undefined,
      postConditions: [
        Pc.principal(address)
          .willSendGte(amount)
          .ft(
            contract.marketAsset!.address as ContractIdString,
            contract.marketAsset!.name
          ),
      ],
    };

    const transaction = await makeUnsignedContractCall(txOptions);
    const sign = await (window.LeatherProvider as LeatherProvider)!.request(
      "stx_signTransaction",
      {
        txHex: transaction.serialize(),
        network: contract.network,
      }
    );

    const { txid } = await broadcastTransaction({
      transaction: deserializeTransaction(sign.result.txHex),
      network: contract.network,
    });

    setTxid(txid);
  }, [connection, contract, showMessage, amountRaw]);

  const txLink = useMemo(() => {
    return txid ? transactionLink(txid, contract.network) : "";
  }, [txid, contract.network]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountRaw(e.target.value);
  };

  return (
    <>
      <DialogTitle>
        {t("Deposit Market Asset")}
        <CloseModal onClick={handleClose} />
      </DialogTitle>
      <DialogContent>
        <Box sx={{ p: "10px 0" }}>
          {txid ? (
            <Box sx={{ wordBreak: "break-word" }}>
              <Typography>
                {t("A transaction successfully broadcasted to deposit:")}
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
              label={t("Enter amount to deposit")}
              value={amountRaw}
              autoComplete="off"
              helperText={t("e.g. 100")}
              onChange={handleAmountChange}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSubmit} disabled={inProgress}>
          {t("Submit")}
        </Button>
      </DialogActions>
    </>
  );
};

export default DepositDialog;
