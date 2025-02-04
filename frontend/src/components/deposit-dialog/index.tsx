import { LeatherProvider } from "@leather.io/rpc";
import { Box } from "@mui/material";
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
import { TESTNET_FEE } from "granite-liq-bot-common";
import { useState } from "react";
import useTranslation from "../../hooks/use-translation";
import { useModalStore } from "../../store/ui";
import { Contract } from "../../types";
import CloseModal from "../close-modal";

const DepositDialog = ({ contract }: { contract: Contract }) => {
  const [t] = useTranslation();
  const { setModal } = useModalStore();

  const [inProgress] = useState(false);

  console.log(contract);
  const handleClose = () => {
    setModal(null);
  };

  const handleSubmit = async () => {
    const response = await window.LeatherProvider?.request("getAddresses");
    if (!response) {
      return;
    }
    const { addresses } = response.result;

    const publicKey = addresses.find(
      (address) => address.symbol === "STX"
    )!.publicKey;

    const txOptions = {
      contractAddress: contract.address,
      contractName: contract.name,
      functionName: "deposit",
      functionArgs: [
        contractPrincipalCV(
          contract.marketAsset!.address.split(".")[0],
          contract.marketAsset!.address.split(".")[1]
        ),
        uintCV(100),
      ],
      network: contract.network,
      publicKey,
      fee: contract.network === "testnet" ? TESTNET_FEE : undefined,
      postConditions: [
        Pc.principal(contract.id)
          .willSendGte(100)
          .ft(
            contract.marketAsset!.address as ContractIdString,
            contract.marketAsset!.symbol
          ),
      ],
    };

    const transaction = await makeUnsignedContractCall(txOptions);

    const response2 =
      await (window.LeatherProvider as LeatherProvider)!.request(
        "stx_signTransaction",
        {
          txHex: transaction.serialize(),
          network: contract.network,
        }
      );

    console.log(response2.result.txHex);

    const response3 = await broadcastTransaction({
      transaction: deserializeTransaction(response2.result.txHex),
      network: contract.network,
    });

    console.log(response3);
  };

  return (
    <>
      <DialogTitle>
        {t("Deposit Market Asset")}
        <CloseModal onClick={handleClose} />
      </DialogTitle>
      <DialogContent>
        <Box sx={{ p: "10px 0" }}></Box>
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
