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
import NetworkChip from "../network-chip";

export const ContractInfo = ({ data }: { data: Contract }) => {
  const [t] = useTranslation();
 const {  setModal } = useModalStore();



  const depositClicked = () => {
    setModal(null);
  }

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
            <TableCell component="th" scope="row" >
              <Typography sx={{ fontWeight: "500" }}>{t("Network")}</Typography>
            </TableCell>
            <TableCell> <NetworkChip network={data.network} /> </TableCell>
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
                {t("Market assets")}
              </Typography>
            </TableCell>
            <TableCell sx={{ display: "flex", alignItems: "center" }}>
              <Box sx={{ mr: "12px" }}>
                {data.marketAssets.length > 0 ? (
                  <Typography>{data.marketAssets.join(", ")}</Typography>
                ) : (
                  <Typography>{t("-")}</Typography>
                )}
              </Box>
              <Button>Add</Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ fontWeight: "bold" }}>
              <Typography sx={{ fontWeight: "500" }}>
                {t("Unprofitability threshold")}
              </Typography>
            </TableCell>
            <TableCell sx={{ display: "flex", alignItems: "center" }}>
              <Typography sx={{ mr: "12px" }}>
                {data.unprofitabilityThreshold}
              </Typography>
              <Button size="small">
                Set
              </Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ fontWeight: "bold" }}>
              <Typography sx={{ fontWeight: "500" }}>
                {t("Balances")}
              </Typography>
            </TableCell>
            <TableCell>
              <Button size="small" onClick={depositClicked}>
              {t("Deposit")}
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};
