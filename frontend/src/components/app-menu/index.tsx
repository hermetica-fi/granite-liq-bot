import { Box, Typography, useTheme } from "@mui/material";
import { useNavigate } from "@reach/router";
import { StacksNetworkName } from "@stacks/network";
import { useCallback } from "react";

const AppMenu = ({ network }: { network?: StacksNetworkName  }) => {
  console.log(network)
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        width: "100%",
        height: "50px",
        display: "flex",
        alignItems: "center",
        mb: "20px",
        boxShadow: `${theme.palette.divider} 1px 2px 10px 0px`,
      }}
    >
      <Typography
        variant="h5"
        component="div"
        sx={{
          ml: "12px",
          mr: "12px",
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={useCallback(() => {
          navigate("/");
        }, [navigate])}
      >
        <Box
          component="img"
          sx={{ mr: "4px" }}
          src="/icon.svg"
          alt="Granite Liqudiation Bot"
        />
        Liquidation Bot
      </Typography>
      <Typography
        component="div"
        sx={{
          ml: "20px",
          cursor: "pointer",
          "&:hover": { color: theme.palette.primary.main },
        }}
        onClick={useCallback(() => {
            navigate(`/borrowers/${network}`);
          }, [navigate, network])}
      >
        Borrowers
      </Typography>
    </Box>
  );
};

export default AppMenu;
