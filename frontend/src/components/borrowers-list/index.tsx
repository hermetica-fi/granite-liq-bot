import { TablePagination } from "@mui/material";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { BorrowerStatusEntity } from "granite-liq-bot-common";
import { NetworkName } from "granite-liq-bot-common";
import { useCallback, useEffect, useState } from "react";
import { fetchBorrowers } from "../../api";
import useTranslation from "../../hooks/use-translation";

const BorrowersList = ({ network }: { network: NetworkName }) => {
  const [borrowers, setBorrowers] = useState<BorrowerStatusEntity[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(40);
  const [t] = useTranslation();

  const load = useCallback(() => {
    fetchBorrowers(network).then((data) => {
      setBorrowers(data);
    });
  }, [network]);

  useEffect(() => {
    load();

    const interval = setInterval(() => {
      load();
    }, 5_000);

    return () => clearInterval(interval);
  }, [load]);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    },
    []
  );

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{}}>
              <TableCell>{t("ACCOUNT")}</TableCell>
              <TableCell align="right">{t("LTV")}</TableCell>
              <TableCell align="right">{t("COLLATERAL")}</TableCell>
              <TableCell align="right">{t("DEBT")}</TableCell>
              <TableCell align="right">{t("RISK")}</TableCell>
              <TableCell align="right">{t("AVAILABLE TO LIQUIDATE")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {borrowers.map((row) => (
              <TableRow
                hover
                key={row.address}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {row.address}
                </TableCell>
                <TableCell align="right">
                  {row.ltv}
                  {"%"}
                </TableCell>
                <TableCell align="right">{row.collateral}</TableCell>
                <TableCell align="right">{row.debt}</TableCell>
                <TableCell align="right">
                  {(row.risk * 100).toFixed(2)}
                  {"%"}
                </TableCell>
                <TableCell align="right">
                  {row.maxRepayAmount.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[40, 100]}
        component="div"
        count={borrowers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </>
  );
};

export default BorrowersList;
