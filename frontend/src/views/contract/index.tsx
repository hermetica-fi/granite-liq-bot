import { Box, CircularProgress, Typography } from "@mui/material";
import { RouteComponentProps, useParams } from "@reach/router";
import { useEffect } from "react";
import AppMenu from "../../components/app-menu";
import { ContractInfo } from "../../components/contract-info";
import useTranslation from "../../hooks/use-translation";
import { useContractStore } from "../../store/contract";
import { useContractsListStore } from "../../store/contracts-list";

const ContractPage = (_: RouteComponentProps) => {
  const { contracts } = useContractsListStore();
  const { loadContract, data, loading } = useContractStore();
  const params = useParams();
  const { id } = params;
  const [t] = useTranslation();

  const contract = contracts.find((c) => c.id === id);

  useEffect(() => {
    if (contract && contract.id !== data?.id) {
      loadContract(contract);
    }
  }, [contract, loadContract, data]);

  if (!contract) {
    return <Typography>{t("Not found")}</Typography>;
  }
  
  return (
    <>
      <AppMenu network={contract.network} />
      <Box sx={{ ml: "12px", mr: "12px" }}>
        {loading ? (
          <CircularProgress />
        ) : data ? (
          <ContractInfo />
        ) : null}
      </Box>
    </>
  );
};

export default ContractPage;
