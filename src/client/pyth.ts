import { PRICE_FEED_IDS } from "../constants";

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

export async function fetchAndProcessPriceFeed(): Promise<FeedResponse> {
  const feedParams = PRICE_FEED_IDS.map((t) => `ids[]=${t.feed_id}`).join('&');
  const url = `https://hermes.pyth.network/v2/updates/price/latest?${feedParams}&binary=true`;

  const data = await fetch(url).then(r => r.arrayBuffer())

  const buffer = Buffer.from(data);
  const decodedText = buffer.toString();
  const result = JSON.parse(decodedText);

  const attestation = result.binary.data[0];
  const items = result.parsed.reduce(
    (acc: any, item: any, index: number) => {
      acc[PRICE_FEED_IDS[index].ticker] = item
      return acc;
    },
    {}
  );

  return {
    attestation: attestation,
    items,
  };
}

