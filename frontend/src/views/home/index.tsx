import { Box } from "@mui/material";
import AddContractForm from "../../components/add-contract-form";
import { useContracts } from "../../hooks/use-contracts";

const Home = () => {
    const { contracts } = useContracts();

    if(contracts.list.length === 0) {
        return <Box sx={{ maxWidth: '600px' }}>
            <AddContractForm />
        </Box>
    };
  

    return <div>Contracts</div>;
}

export default Home;