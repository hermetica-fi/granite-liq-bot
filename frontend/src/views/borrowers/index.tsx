import { Box, TablePagination, Typography } from "@mui/material";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { RouteComponentProps } from "@reach/router";
import { useEffect, useState } from "react";
import { fetchBorrowers } from "../../api";
import AppMenu from "../../components/app-menu";
import useTranslation from "../../hooks/use-translation";
import { Borrower } from "../../types";

const BorrowersPage = (_: RouteComponentProps) => {
  const [t] = useTranslation();

  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(40);

  useEffect(() => {
    fetchBorrowers("mainnet").then((data) => {
      setBorrowers(data);
    });
  }, []);
 
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <>
      <AppMenu />
      <Box sx={{ ml: "12px", mr: "12px" }}>
        <Typography variant="h6" sx={{ mb: "20px" }}>
          {t("Borrowers")}
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{  }}>
                <TableCell>ACCOUNT</TableCell>
                <TableCell align="right">COLLATERAL</TableCell>
                <TableCell align="right">DEBT</TableCell>
                <TableCell align="right">RISK</TableCell>
                <TableCell align="right">AVAILABLE TO LIQUIDATE</TableCell>
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
                  <TableCell align="right">{row.collateral}</TableCell>
                  <TableCell align="right">{row.debt}</TableCell>
                  <TableCell align="right">{(row.risk * 100).toFixed(2)}%</TableCell>
                  <TableCell align="right">{row.liquidateAmt.toFixed(2)}</TableCell>
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
      </Box>
    </>
  );
};

export default BorrowersPage;
