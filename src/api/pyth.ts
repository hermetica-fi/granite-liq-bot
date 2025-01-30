export const getPriceFeed = async (feedId: string): Promise<number> => {
    return fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}`).then(r => r.json()).then(r => Number(r.parsed[0].price.price))
}