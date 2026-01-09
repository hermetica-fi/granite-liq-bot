import { type CollateralToken, type Token } from './types';

export const AEUSDC_CONTRACT = {
  id: 'aeUSDC',
  name: 'token-aeusdc',
  principal: 'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K',
};

export const SBTC_CONTRACT = {
  id: 'sbtc-token',
  name: 'sbtc-token',
  principal: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4',
};

export const USDCX_CONTRACT = {
  id: 'usdcx-token',
  name: 'usdcx',
  principal: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE',
};

export const AEUSDC_TOKEN: Token = {
  display_name: 'aeUSDC',
  contract: AEUSDC_CONTRACT,
  decimals: 6,
  display_decimals: 4,
  image:
    'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  price_feed:
    'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  asset_cap: 15000000,
  dust_threshold: 0.01,
}

export const USDCX_TOKEN: Token = {
  display_name: 'USDCx',
  contract: USDCX_CONTRACT,
  decimals: 6,
  display_decimals: 4,
  image:
    'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  price_feed:
    'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  asset_cap: 15000000,
  dust_threshold: 0.01,
}

export const SBTC_TOKEN: CollateralToken = {
  display_name: 'sBTC',
  maxLTV: 0.5,
  liquidationLTV: 0.65,
  liquidationPremium: 0.1,
  contract: SBTC_CONTRACT,
  decimals: 8,
  display_decimals: 5,
  image:
    'https://teal-worldwide-cattle-228.mypinata.cloud/ipfs/bafkreigsh7sxsgbxfgx7mfvepqhtdkuec6nmzgwjscx5w3rg6ikoungz3q',
  price_feed:
    'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
}