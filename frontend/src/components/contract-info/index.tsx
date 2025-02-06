import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Box, Button, Link, Typography } from "@mui/material";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import { addressLink, formatUnits } from "granite-liq-bot-common";
import { useCallback } from "react";
import useToast from "../../hooks/use-toast";
import useTranslation from "../../hooks/use-translation";
import { useContractStore } from "../../store/contract";
import { useModalStore } from "../../store/ui";
import DepositDialog from "../deposit-dialog";
import NetworkChip from "../network-chip";

export const ContractInfo = () => {
  const [t] = useTranslation();
  const { setModal } = useModalStore();
  const store = useContractStore();
  const contract = store.data!;
  const [showMessage] = useToast();

  const depositClicked = () => {
    if(!contract.marketAsset) {
      showMessage("Market asset not set", "error");
      return;
    }

    setModal({
      body: <DepositDialog />,
    });
  };

  const renderAddress = useCallback(
    (address: string) => {
      return (
        <Typography sx={{ display: "flex", alignItems: "center" }}>
          {address}
          <Link
            href={addressLink(address, contract.network)}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: "flex", alignItems: "center", ml: "10px" }}
          >
            <OpenInNewIcon fontSize="small" />
          </Link>
        </Typography>
      );
    },
    [contract.network]
  );

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ width: "200px" }}>
              <Typography sx={{ fontWeight: "500" }}>{t("Address")}</Typography>
            </TableCell>
            <TableCell>{renderAddress(contract.id)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              <Typography sx={{ fontWeight: "500" }}>{t("Network")}</Typography>
            </TableCell>
            <TableCell>
              {" "}
              <NetworkChip network={contract.network} />{" "}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              <Typography sx={{ fontWeight: "500" }}>{t("Owner")}</Typography>
            </TableCell>
            <TableCell>{renderAddress(contract.ownerAddress)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              <Typography sx={{ fontWeight: "500" }}>
                {t("Operator")}
              </Typography>
            </TableCell>
            <TableCell>{renderAddress(contract.operatorAddress)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              <Typography sx={{ fontWeight: "500" }}>
                {t("Operator balance")}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography>
                {formatUnits(contract.operatorBalance, 6)} {"STX"}
              </Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              <Typography sx={{ fontWeight: "500" }}>
                {t("Market asset")}
              </Typography>
            </TableCell>
            <TableCell sx={{ display: "flex", alignItems: "center" }}>
              {contract.marketAsset ? (
                <Box sx={{ mr: "12px" }}>
                  {renderAddress(contract.marketAsset.address)}
                </Box>
              ) : (
                <Typography>{t("-")} </Typography>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              <Typography sx={{ fontWeight: "500" }}>
                {t("Market Asset Balance")}
              </Typography>
            </TableCell>
            <TableCell sx={{ display: "flex", alignItems: "center" }}>
              {contract.marketAsset ? (
                <Typography sx={{ mr: "12px" }}>
                  {formatUnits(
                    contract.marketAsset.balance,
                    contract.marketAsset.decimals
                  )}{" "}
                  {contract.marketAsset.symbol}
                </Typography>
              ) : (
                <Typography>{t("-")} </Typography>
              )}
              <Button variant="outlined" size="small" onClick={depositClicked}>
                {t("Deposit")}
              </Button>
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell component="th" scope="row">
              <Typography sx={{ fontWeight: "500" }}>
                {t("Collateral asset")}
              </Typography>
            </TableCell>
            <TableCell sx={{ display: "flex", alignItems: "center" }}>
              {contract.collateralAsset ? (
                <Box sx={{ mr: "12px" }}>
                  {renderAddress(contract.collateralAsset.address)}
                </Box>
              ) : (
                <Typography> {t("-")} </Typography>
              )}
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell component="th" scope="row">
              <Typography sx={{ fontWeight: "500" }}>
                {t("Collateral Asset Balance")}
              </Typography>
            </TableCell>
            <TableCell sx={{ display: "flex", alignItems: "center" }}>
              {contract.collateralAsset ? (
                <Typography sx={{ mr: "12px" }}>
                  {formatUnits(
                    contract.collateralAsset.balance,
                    contract.collateralAsset.decimals
                  )}{" "}
                  {contract.collateralAsset.symbol}
                </Typography>
              ) : (
                <Typography sx={{ width: "40px" }}>{t("-")} </Typography>
              )}
            </TableCell>
          </TableRow>


          <TableRow>
            <TableCell component="th" scope="row">
              <Typography sx={{ fontWeight: "500" }}>
                {t("Unprofitability threshold")}
              </Typography>
            </TableCell>
            <TableCell sx={{ display: "flex", alignItems: "center" }}>
              <Typography>
                {contract.unprofitabilityThreshold}
              </Typography>
            </TableCell>
          </TableRow>
         
        </TableBody>
      </Table>
    </TableContainer>
  );
};
