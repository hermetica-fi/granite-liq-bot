import { getMarketState } from "./dba/market";

export const getPriceFeed = () => {
    const market = getMarketState();
}

export const shouldUpdatePyth = () => {

}