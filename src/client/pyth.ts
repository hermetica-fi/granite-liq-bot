type PriceFeedItem = {
  id: string,
  price: {
    price: string,
    conf: string,
    expo: number,
    publish_time: number,
  },
  ema_price: {
    price: string,
    conf: string,
    expo: number,
    publish_time: number,
  },
  metadata: {
    slot: number,
    proof_available_time: number,
    prev_publish_time: number,
  },
}

type FeedResponse = {
  attestation: string,
  items: Record<string, PriceFeedItem>
}

export async function fetchAndProcessPriceFeed(tokens: { ticker: string, price_feed: string }[]): Promise<FeedResponse> {
  const feedParams = tokens.map((t) => `ids[]=${t.price_feed}`).join('&');
  const url = `https://hermes.pyth.network/v2/updates/price/latest?${feedParams}&binary=true`;

  const data = await fetch(url).then(r => r.arrayBuffer())

  const buffer = Buffer.from(data);
  const decodedText = buffer.toString();
  const result = JSON.parse(decodedText);

  const attestation = result.binary.data[0];
  const items = result.parsed.reduce(
    (acc: any, item: any, index: number) => {
      acc[tokens[index].ticker] = item
      return acc;
    },
    {}
  );

  return {
    attestation: attestation,
    items,
  };
}

