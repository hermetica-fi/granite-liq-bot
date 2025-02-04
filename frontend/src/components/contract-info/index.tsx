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
import useTranslation from "../../hooks/use-translation";
import { useModalStore } from "../../store/ui";
import { Contract } from "../../types";
import ManageAssetDialog from "../market-asset-dialog";
import NetworkChip from "../network-chip";

export const ContractInfo = ({ data }: { data: Contract }) => {
  const [t] = useTranslation();
  const { setModal } = useModalStore();

  const setMarketAssetClicked = () => {
    setModal({
      body: <ManageAssetDialog contract={data} />,
    });
  };

  const depositClicked = () => {
    setModal(null);
  };

  const thresholdSetClicked = () => {
    setModal(null);
  };

  const renderAddress = useCallback(
    (address: string) => {
      return (
        <Typography sx={{ display: "flex", alignItems: "center" }}>
          {address}
          <Link
            href={addressLink(address, data.network)}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: "flex", alignItems: "center", ml: "10px" }}
          >
            <OpenInNewIcon fontSize="small" />
          </Link>
        </Typography>
      );
    },
    [data.network]
  );

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ width: "200px" }}>
              <Typography sx={{ fontWeight: "500" }}>{t("Address")}</Typography>
            </TableCell>
            <TableCell>{renderAddress(data.id)}</TableCell>
          </TableRow>

          <TableRow>
            <TableCell component="th" scope="row">
              <Typography sx={{ fontWeight: "500" }}>{t("Network")}</Typography>
            </TableCell>
            <TableCell>
              {" "}
              <NetworkChip network={data.network} />{" "}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              <Typography sx={{ fontWeight: "500" }}>{t("Owner")}</Typography>
            </TableCell>
            <TableCell>{renderAddress(data.ownerAddress)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              <Typography sx={{ fontWeight: "500" }}>
                {t("Operator")}
              </Typography>
            </TableCell>
            <TableCell>{renderAddress(data.operatorAddress)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              <Typography sx={{ fontWeight: "500" }}>
                {t("Operator balance")}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography>
                {formatUnits(data.operatorBalance, 6)} {"STX"}
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
              {data.marketAsset ? (
                <Box sx={{ mr: "12px" }}>
                  {renderAddress(data.marketAsset.address)}
                </Box>
              ) : (
                <Typography sx={{ width: "30px" }}> {t("-")} </Typography>
              )}
              <Button variant="outlined" size="small" onClick={setMarketAssetClicked}>
                {t("Set")}
              </Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              <Typography sx={{ fontWeight: "500" }}>
                {t("Unprofitability threshold")}
              </Typography>
            </TableCell>
            <TableCell sx={{ display: "flex", alignItems: "center" }}>
              <Typography sx={{ width: "30px" }}>
                {data.unprofitabilityThreshold}
              </Typography>
              <Button variant="outlined" size="small" onClick={thresholdSetClicked}>
                {t("Set")}
              </Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              <Typography sx={{ fontWeight: "500" }}>
                {t("Market Asset Balance")}
              </Typography>
            </TableCell>
            <TableCell sx={{ display: "flex", alignItems: "center" }}>
              {data.marketAsset ? (
                <Typography sx={{ mr: "12px" }}>
                  {formatUnits(
                    data.marketAsset.balance,
                    data.marketAsset.decimals
                  )}{" "}
                  {data.marketAsset.symbol}
                </Typography>
              ) : (
                <Typography sx={{ width: "30px" }}>{t("-")} </Typography>
              )}
              <Button variant="outlined" size="small" onClick={depositClicked}>
                {t("Deposit")}
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};
