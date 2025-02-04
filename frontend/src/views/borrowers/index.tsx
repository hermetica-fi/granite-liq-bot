import {
  Box,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { navigate, RouteComponentProps, useParams } from "@reach/router";
import type { BorrowerStatusEntity } from "granite-liq-bot-common";
import { useCallback, useEffect, useState } from "react";
import { fetchBorrowers } from "../../api";
import AppMenu from "../../components/app-menu";
import BorrowersList from "../../components/borrowers-list";
import useTranslation from "../../hooks/use-translation";

const BorrowersPage = (_: RouteComponentProps) => {
  const [t] = useTranslation();
  const [borrowers, setBorrowers] = useState<BorrowerStatusEntity[]>([]);
  const params = useParams();
  const network = ["mainnet", "testnet"].includes(params.network)
    ? params.network
    : "mainnet";

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
