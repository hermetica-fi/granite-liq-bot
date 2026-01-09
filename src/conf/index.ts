import { AEUSDC_TOKEN, SBTC_TOKEN, USDCX_TOKEN } from './constants';
import { GRANITE_MARKETS, type Config } from './types';

const config: Config = {
  markets: {
    AEUSDC: {
      market_id: GRANITE_MARKETS.AEUSDC,
      market_asset: AEUSDC_TOKEN,
      collaterals: [
        SBTC_TOKEN,
      ],
      contracts: {
        INTEREST_RATE: {
          id: 'linear-kinked-ir-v1',
          name: 'linear-kinked-ir-v1',
          principal: 'SP35E2BBMDT2Y1HB0NTK139YBGYV3PAPK3WA8BRNA',
        },
        PYTH_STORAGE: {
          id: 'pyth-storage-v4',
          name: 'pyth-storage-v4',
          principal: 'SP1CGXWEAMG6P6FT04W66NVGJ7PQWMDAC19R7PJ0Y',
        },
      },
      scaling_factor: 1000000000000,
      apiBase: 'https://api.granite.world'
    },
    AEUSDC_STAGING: {
      market_id: GRANITE_MARKETS.AEUSDC_STAGING,
      market_asset: AEUSDC_TOKEN,
      collaterals: [
        SBTC_TOKEN,
      ],
      contracts: {
        INTEREST_RATE: {
          id: 'linear-kinked-ir-v1',
          name: 'linear-kinked-ir-v1',
          principal: 'SP3Y6GFKWN50HPA8RKRXMY0EXAJR9VXPY899P88JN',
        },
        PYTH_STORAGE: {
          id: 'pyth-storage-v4',
          name: 'pyth-storage-v4',
          principal: 'SP1CGXWEAMG6P6FT04W66NVGJ7PQWMDAC19R7PJ0Y',
        },
      },
      scaling_factor: 1000000000000,
      apiBase: 'https://api-staging.granite.world'
    },
    USDCX: {
      market_id: GRANITE_MARKETS.USDCX,
      market_asset: USDCX_TOKEN,
      collaterals: [
        SBTC_TOKEN,
      ],
      contracts: {
        INTEREST_RATE: {
          id: 'linear-kinked-ir-v1',
          name: 'linear-kinked-ir-v1',
          principal: 'SP3M2BYF7RGF8WKW5FVDNJ6WR8D7AR9BHDXAKPXZE',
        },
        PYTH_STORAGE: {
          id: 'pyth-storage-v4',
          name: 'pyth-storage-v4',
          principal: 'SP1CGXWEAMG6P6FT04W66NVGJ7PQWMDAC19R7PJ0Y',
        },
      },
      scaling_factor: 1000000000000,
      apiBase: 'https://api-usdcx.granite.world'
    }
  }
}

export default config;
