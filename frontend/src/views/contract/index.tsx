import { RouteComponentProps, useParams } from "@reach/router";
import { useContractsStore } from "../../store/contracts";
import { Typography } from "@mui/material";
import useTranslation from "../../hooks/use-translation";

const ContractPage = (_: RouteComponentProps) => {
  const { contracts } = useContractsStore();
  const params = useParams();
  const { id } = params;
  const [t] = useTranslation();

  const contract = contracts.find((c) => c.id === id);

  if (!contract) {
    return <Typography>{t("Not found")}</Typography>;
  }

  return <div>Contract</div>;
};

export default ContractPage;
