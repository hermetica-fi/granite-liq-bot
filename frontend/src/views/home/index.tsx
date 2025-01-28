import { useContracts } from "../../hooks/use-contracts";

const Home = () => {
    const { contracts } = useContracts();

    console.log("contracts", contracts);
  

    return <div>Contracts</div>;
}

export default Home;