import { Box, MenuItem, Select, SelectChangeEvent, Typography } from "@mui/material";
import { navigate, RouteComponentProps, useParams } from "@reach/router";
import { useCallback, useEffect, useState } from "react";
import { fetchBorrowers } from "../../api";
import AppMenu from "../../components/app-menu";
import BorrowersList from "../../components/borrowers-list";
import useTranslation from "../../hooks/use-translation";
import { Borrower } from "../../types";

const BorrowersPage = (_: RouteComponentProps) => {
  const [t] = useTranslation();
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const params = useParams();
  const network = ["mainnet", "testnet"].includes(params.network)
    ? params.network
    : "mainnet";

  useEffect(() => {
    fetchBorrowers(network).then((data) => {
      setBorrowers(data);
    });
  }, [network]);

  const handleNetworkChange = useCallback((event: SelectChangeEvent) => {
    navigate(`/borrowers/${event.target.value}`);
  }, []);

  return (
    <>
      <AppMenu />
      <Box sx={{ ml: "12px", mr: "12px" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: "20px",
          }}
        >
          <Typography variant="h6">{t("Borrowers")}</Typography>
          <Select value={network} size="small" onChange={handleNetworkChange}>
            <MenuItem value="mainnet">{t("Mainnet")}</MenuItem>
            <MenuItem value="testnet">{t("Testnet")}</MenuItem>
          </Select>
        </Box>

        <BorrowersList borrowers={borrowers} />
      </Box>
    </>
  );
};

export default BorrowersPage;
