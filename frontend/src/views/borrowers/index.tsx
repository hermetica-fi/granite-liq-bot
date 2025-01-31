import { Box, Typography } from "@mui/material";
import { RouteComponentProps } from "@reach/router";
import AppMenu from "../../components/app-menu";
import useTranslation from "../../hooks/use-translation";

const BorrowersPage = (_: RouteComponentProps) => {
  const [t] = useTranslation();
  return (
    <>
      <AppMenu />
      <Box sx={{ ml: "12px", mr: "12px" }}>
        <Typography variant="h6">{t("Borrowers")}</Typography>
      </Box>
    </>
  );
};

export default BorrowersPage;
