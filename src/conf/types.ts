export enum GRANITE_MARKETS {
  AEUSDC = 'AEUSDC',
  AEUSDC_STAGING = 'AEUSDC_STAGING',
  USDCX = 'USDCX'
}

export interface Contract {
  id: string;
  name: string;
  principal: string;
}

export interface Token {
  display_name: string;
  contract: Contract;
  decimals: number;
  display_decimals: number;
  image: string;
  price_feed?: string;
  asset_cap?: number;
  dust_threshold?: number;
}

export interface CollateralToken extends Token {
  liquidationLTV: number;
  liquidationPremium: number;
  maxLTV: number;
}

export enum GraniteContracts {
  INTEREST_RATE = 'INTEREST_RATE',
  PYTH_STORAGE = 'PYTH_STORAGE',
}

export interface Market {
  market_id: GRANITE_MARKETS;
  market_asset: Token;
  collaterals: CollateralToken[];
  contracts: Record<GraniteContracts, Contract>;
  scaling_factor: number;
  apiBase: string;
}

export interface Config {
  markets: Record<GRANITE_MARKETS, Market>;
}
