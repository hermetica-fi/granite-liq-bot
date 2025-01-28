import { useContracts } from "../../hooks/use-contracts";

const Home = () => {
    const { contracts } = useContracts();

    console.log("contracts", contracts);

    if(contracts.list.length === 0) return <div>No contracts found</div>;
  

    return <div>Contracts</div>;
}

export default Home;