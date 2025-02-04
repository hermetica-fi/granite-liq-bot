import { Box, Button, Typography } from "@mui/material";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import { RouteComponentProps, useParams } from "@reach/router";
import { useEffect } from "react";
import AppMenu from "../../components/app-menu";
import useTranslation from "../../hooks/use-translation";
import { useContractStore } from "../../store/contract";
import { useContractsListStore } from "../../store/contracts-list";

const ContractPage = (_: RouteComponentProps) => {
  const { contracts } = useContractsListStore();
  const { loadContract, data, loading } = useContractStore();
  const params = useParams();
  const { id } = params;
  const [t] = useTranslation();

  const contract = contracts.find((c) => c.id === id);

  useEffect(() => {
    if (contract) {
      loadContract(contract);
    }
  }, [contract, loadContract]);

  if (!contract) {
    return <Typography>{t("Not found")}</Typography>;
  }

  if (loading) {
    // return <CircularProgress />;
  }

  if (!data) {
    return null;
  }

  return (
    <>
      <AppMenu network={contract.network} />
      <Box sx={{ ml: "12px", mr: "12px" }}>
        <Typography variant="h6" sx={{ mb: "20px" }}>
          {id}
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell component="th" scope="row" sx={{ width: "200px" }}>
                  <Typography sx={{ fontWeight: "500" }}>
                    {t("Owner")}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography>{data.ownerAddress}</Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  component="th"
                  scope="row"
                  sx={{ fontWeight: "bold" }}
                >
                  <Typography sx={{ fontWeight: "500" }}>
                    {t("Operator")}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography>{data.operatorAddress}</Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  component="th"
                  scope="row"
                  sx={{ fontWeight: "bold" }}
                >
                  <Typography sx={{ fontWeight: "500" }}>
                    {t("Operator balance")}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography>{data.operatorBalance}</Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  component="th"
                  scope="row"
                  sx={{ fontWeight: "bold" }}
                >
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
                  <Button variant="outlined">Add</Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  component="th"
                  scope="row"
                  sx={{ fontWeight: "bold" }}
                >
                  <Typography sx={{ fontWeight: "500" }}>
                    {t("Unprofitability threshold")}
                  </Typography>
                </TableCell>
                <TableCell sx={{ display: "flex", alignItems: "center" }}>
                  <Typography sx={{ mr: "12px" }}>
                    {data.unprofitabilityThreshold}
                  </Typography>
                  <Button size="small" variant="outlined">Set</Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  component="th"
                  scope="row"
                  sx={{ fontWeight: "bold" }}
                >
                  <Typography sx={{ fontWeight: "500" }}>
                    {t("Balances")}
                  </Typography>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
};

export default ContractPage;
