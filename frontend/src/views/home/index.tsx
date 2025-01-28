import AddContractForm from "../../components/add-contract-form";
import { useContracts } from "../../hooks/use-contracts";

const Home = () => {
    const { contracts } = useContracts();

    console.log("contracts", contracts);

    if(contracts.list.length === 0) return <AddContractForm />;
  

    return <div>Contracts</div>;
}

export default Home;