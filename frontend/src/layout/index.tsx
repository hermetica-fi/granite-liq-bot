import { Box, useTheme, Typography } from "@mui/material";
import { grey } from "@mui/material/colors";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        color: theme.palette.mode === "light" ? grey[900] : grey[300],
        bgcolor: theme.palette.mode === "light" ? grey[50] : grey[900],
      }}
    >
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
          variant="h6"
          sx={{ ml: "12px", mr: "12px", display: "flex", alignItems: "center" }}
        >
          <Box
            component="img"
            sx={{ mr: "4px" }}
            src="/icon.svg"
            alt="Granite Liqudiation Bot"
          />
          Liquidation Bot
        </Typography>
      </Box>
      <Box sx={{ ml: '12px', mr: '12px', background: 'red' }}>{children}</Box>
    </Box>
  );
};

export default Layout;
