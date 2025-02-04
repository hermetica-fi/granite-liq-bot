import { Button, TablePagination } from "@mui/material";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { BorrowerStatusEntity } from "granite-liq-bot-common";
import { useCallback, useState } from "react";
import useTranslation from "../../hooks/use-translation";

const BorrowersList = ({ borrowers }: { borrowers: BorrowerStatusEntity[] }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(40);
  const [t] = useTranslation();

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleLiquidateClicked = useCallback((address: string) => {
    console.log("liquidate", address);
  }, []);

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
              <TableCell align="right"></TableCell>
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
                <TableCell align="right">{row.ltv}{"%"}</TableCell>
                <TableCell align="right">{row.collateral}</TableCell>
                <TableCell align="right">{row.debt}</TableCell>
                <TableCell align="right">
                  {(row.risk * 100).toFixed(2)}{"%"}
                </TableCell>
                <TableCell align="right">
                  {row.maxRepayAmount.toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  <Button variant="contained" color="primary" onClick={() => handleLiquidateClicked(row.address)}>
                    {t("LIQUIDATE")}
                  </Button>
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
