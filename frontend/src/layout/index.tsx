import { Box, Paper, useTheme, Typography } from "@mui/material";
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
        alignItems: "center",

        color: theme.palette.mode === "light" ? grey[900] : grey[300],
        bgcolor: theme.palette.mode === "light" ? grey[50] : grey[900],
      }}
    >
      <Paper
      elevation={1}
        sx={{
          width: "100%",
          height: "50px",
          display: "flex",
          alignItems: "center",
          pl: "12px",
          pr: "12px",
          mb: '20px'
        }}
      >
        <Typography variant="h6">Granite Liqudiation Bot</Typography>
      </Paper>
      {children}
    </Box>
  );
};

export default Layout;
