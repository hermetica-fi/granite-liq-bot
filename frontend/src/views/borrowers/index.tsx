import { Box, TablePagination, Typography, useTheme } from "@mui/material";
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
  const theme = useTheme();
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [page, setPage] = useState(0);

  console.log(borrowers);

  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    fetchBorrowers("mainnet").then((data) => {
      setBorrowers(data);
    });
  }, []);
  function createData(
    name: string,
    calories: number,
    fat: number,
    carbs: number,
    protein: number
  ) {
    return { name, calories, fat, carbs, protein };
  }

  const rows = [
    createData("Frozen yoghurt", 159, 6.0, 24, 4.0),
    createData("Ice cream sandwich", 237, 9.0, 37, 4.3),
    createData("Eclair", 262, 16.0, 24, 6.0),
    createData("Cupcake", 305, 3.7, 67, 4.3),
    createData("Gingerbread", 356, 16.0, 49, 3.9),
  ];

  const handleChangePage = (event: unknown, newPage: number) => {
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
              <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                <TableCell>Dessert (100g serving)</TableCell>
                <TableCell align="right">Calories</TableCell>
                <TableCell align="right">Fat&nbsp;(g)</TableCell>
                <TableCell align="right">Carbs&nbsp;(g)</TableCell>
                <TableCell align="right">Protein&nbsp;(g)</TableCell>
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
                  <TableCell align="right">{row.risk}</TableCell>
                  <TableCell align="right">{row.liquidateAmt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={rows.length}
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
