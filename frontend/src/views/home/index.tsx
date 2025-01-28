import { useContracts } from "../../hooks";

const Home = () => {
    const { contracts } = useContracts();

    console.log("contracts", contracts);
  

    return <div>Contracts</div>;
}

export default Home;