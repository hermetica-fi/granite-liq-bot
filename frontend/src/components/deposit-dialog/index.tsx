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
  cvToJSON,
  deserializeTransaction,
  fetchCallReadOnlyFunction,
  makeUnsignedContractCall,
  Pc,
  principalCV,
  uintCV
} from "@stacks/transactions";
import {
  fetchFn,
  formatUnits,
  parseUnits,
  setTxFee,
  transactionLink
} from "granite-liq-bot-common";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [balance, setBalance] = useState<number | null>(null);

  const handleClose = useCallback(() => {
    setModal(null);
  }, [setModal]);

  const marketAsset = useMemo(() => contract.marketAsset!, [contract]);

  useEffect(() => {
    if (!connection) {
      return;
    }

    fetchCallReadOnlyFunction({
      contractAddress: marketAsset.address.split(".")[0],
      contractName: marketAsset.address.split(".")[1],
      functionName: "get-balance",
      functionArgs: [principalCV(connection.address)],
      senderAddress: connection.address,
      network: contract.network,
      client: {
        fetch: fetchFn,
      },
    }).then((r) => {
      const json = cvToJSON(r);
      const balanceBn = Number(json.value.value);
      const balance = formatUnits(balanceBn, marketAsset.decimals);
      setBalance(balance);
    });
  }, [connection, contract, marketAsset]);

  const handleConnect = useCallback(async () => {
    if (!window.LeatherProvider) {
      showMessage("Leather Provider not found", "error");
      return;
    }

    const response = await window.LeatherProvider?.request("getAddresses");
    if (!response) {
      return;
    }

    const { addresses } = response.result;
    const address = addresses.find(
      (address) => address.symbol === "STX"
    )!.address;
    const publicKey = addresses.find(
      (address) => address.symbol === "STX"
    )!.publicKey;

    setConnection({ address, publicKey });
  }, [showMessage]);

  const handleMax = useCallback(() => {
    setAmountRaw(balance?.toString() || "0");
  }, [balance]);

  const handleSubmit = useCallback(async () => {
    if (!connection) {
      return;
    }

    const address = connection.address;
    const publicKey = connection.publicKey;
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
      fee: "10",
      postConditions: [
        Pc.principal(address)
          .willSendGte(amount)
          .ft(
            contract.marketAsset!.address as ContractIdString,
            contract.marketAsset!.symbol
          ),
      ],
    };

    const call = await makeUnsignedContractCall(txOptions);

    await setTxFee(call, contract.network);

    const sign = await (window.LeatherProvider as LeatherProvider)!.request(
      "stx_signTransaction",
      {
        txHex: call.serialize(),
        network: contract.network,
      }
    );

    const { txid } = await broadcastTransaction({
      transaction: deserializeTransaction(sign.result.txHex),
      network: contract.network,
      client: {
        fetch: fetchFn,
      },
    });

    setTxid(txid);
  }, [connection, contract, amountRaw, marketAsset]);

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
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TextField
                fullWidth
                label={t("Enter amount to deposit")}
                value={amountRaw}
                autoComplete="off"
                onChange={handleAmountChange}
              />
              {balance !== null && (
                <Button
                  variant="outlined"
                  sx={{ ml: "10px" }}
                  onClick={handleMax}
                >
                  {t("Max")}
                </Button>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {connection ? (
          <Button onClick={handleSubmit} disabled={inProgress}>
            {t("Submit")}
          </Button>
        ) : (
          <Button onClick={handleConnect} disabled={inProgress}>
            {t("Connect Wallet")}
          </Button>
        )}
      </DialogActions>
    </>
  );
};

export default DepositDialog;
