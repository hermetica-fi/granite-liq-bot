export const pythFetchgGetPriceFeed = async (feedId: string): Promise<any> => {
    return fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}&binary=true`).then(r => r.json()).then((r) => {

        const attestation = r.binary.data[0];

        return {
            attestation: attestation,
            price: Number(r.parsed[0].price.price),
            expo: Number(r.parsed[0].price.expo),
        };
    })
}
