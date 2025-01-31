import { TablePagination } from "@mui/material";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useState } from "react";
import { Borrower } from "../../types";

const BorrowersList = ({ borrowers }: { borrowers: Borrower[] }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(40);

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
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{}}>
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
                <TableCell align="right">
                  {(row.risk * 100).toFixed(2)}%
                </TableCell>
                <TableCell align="right">
                  {row.liquidateAmt.toFixed(2)}
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
