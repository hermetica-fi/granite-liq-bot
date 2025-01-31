import { Box, Typography } from "@mui/material";
import { RouteComponentProps } from "@reach/router";
import { useEffect, useState } from "react";
import { fetchBorrowers } from "../../api";
import AppMenu from "../../components/app-menu";
import BorrowersList from "../../components/borrowers-list";
import useTranslation from "../../hooks/use-translation";
import { Borrower } from "../../types";

const BorrowersPage = (_: RouteComponentProps) => {
  const [t] = useTranslation();
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);

  useEffect(() => {
    fetchBorrowers("mainnet").then((data) => {
      setBorrowers(data);
    });
  }, []);

  return (
    <>
      <AppMenu />
      <Box sx={{ ml: "12px", mr: "12px" }}>
        <Typography variant="h6" sx={{ mb: "20px" }}>
          {t("Borrowers")}
        </Typography>

        <BorrowersList borrowers={borrowers} />
      </Box>
    </>
  );
};

export default BorrowersPage;
