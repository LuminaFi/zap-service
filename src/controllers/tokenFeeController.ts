import { Request, Response, NextFunction } from "express";
import tokenFeeService from "../services/tokenFeeService";
import { formatCurrency } from "../utils/general";
import {
  getSupportedNetworks,
  getSupportedTokensForNetwork,
  getTokenInfoBySymbol,
  getTokenLogoUrl,
  getNetworkLogoUrl,
  normalizeTokenId,
  NETWORKS,
  TOKEN_INFO,
  getTokenAddress,
} from "../constants/tokens";

/**
 * Controller for token fee calculation endpoints
 */
export class TokenFeeController {
  /**
   * Get token price data
   */
  public async getTokenPrice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = req.params.token || "eth";

      const result = await tokenFeeService.getTokenPrice(token);
      const logoUrl =
        getTokenLogoUrl(token) ||
        getTokenLogoUrl(result.tokenSymbol.toLowerCase());

      res.status(200).json({
        success: true,
        ...result,
        logoUrl,
        priceIdrFormatted: formatCurrency(result.priceIdr, "IDR"),
        priceUsdFormatted: formatCurrency(result.priceUsd, "USD"),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate fees for a token amount
   */
  public async calculateFees(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token = "eth", amount, customSpreadFee } = req.query;

      const tokenStr = token as string;
      const amountNum = parseFloat(amount as string);
      let spreadFee: number | undefined = undefined;

      if (customSpreadFee) {
        spreadFee = parseFloat(customSpreadFee as string);
      }

      const result = await tokenFeeService.calculateFees(
        tokenStr,
        amountNum,
        spreadFee
      );

      const logoUrl =
        getTokenLogoUrl(tokenStr) ||
        getTokenLogoUrl(result.tokenSymbol.toLowerCase());

      const formattedResult = {
        ...result,
        logoUrl,
        priceIdrFormatted: formatCurrency(result.priceIdr, "IDR"),
        priceUsdFormatted: formatCurrency(result.priceUsd, "USD"),
        adminFeePercentageFormatted: `${(
          result.adminFeePercentage * 100
        ).toFixed(2)}%`,
        spreadFeePercentageFormatted: `${(
          result.spreadFeePercentage * 100
        ).toFixed(2)}%`,
        totalFeePercentageFormatted: `${(
          result.totalFeePercentage * 100
        ).toFixed(2)}%`,
      };

      res.status(200).json({
        success: true,
        result: formattedResult,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate IDRX amount from source token
   */
  public async calculateIdrxAmount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token = "eth", amount, customSpreadFee } = req.query;

      const tokenStr = token as string;
      const amountNum = parseFloat(amount as string);
      let spreadFee: number | undefined = undefined;

      if (customSpreadFee) {
        spreadFee = parseFloat(customSpreadFee as string);
      }

      const result = await tokenFeeService.calculateIdrxAmount(
        tokenStr,
        amountNum,
        spreadFee
      );

      const logoUrl =
        getTokenLogoUrl(tokenStr) ||
        getTokenLogoUrl(result.feeCalculation.tokenSymbol.toLowerCase());

      const response = {
        success: true,
        token: tokenStr,
        sourceAmount: amountNum,
        idrxAmount: result.idrxAmount,
        idrxAmountFormatted: formatCurrency(result.idrxAmount, "IDR"),
        logoUrl,
        fees: {
          ...result.feeCalculation,
          adminFeePercentageFormatted: `${(
            result.feeCalculation.adminFeePercentage * 100
          ).toFixed(2)}%`,
          spreadFeePercentageFormatted: `${(
            result.feeCalculation.spreadFeePercentage * 100
          ).toFixed(2)}%`,
          totalFeePercentageFormatted: `${(
            result.feeCalculation.totalFeePercentage * 100
          ).toFixed(2)}%`,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate source token amount needed for a desired IDRX amount
   */
  public async calculateSourceAmount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token = "eth", idrxAmount, customSpreadFee } = req.query;

      const tokenStr = token as string;
      const idrxAmountNum = parseFloat(idrxAmount as string);
      let spreadFee: number | undefined = undefined;

      if (customSpreadFee) {
        spreadFee = parseFloat(customSpreadFee as string);
      }

      const result = await tokenFeeService.calculateSourceAmount(
        tokenStr,
        idrxAmountNum,
        spreadFee
      );

      const logoUrl =
        getTokenLogoUrl(tokenStr) ||
        getTokenLogoUrl(result.feeCalculation.tokenSymbol.toLowerCase());

      const response = {
        success: true,
        token: tokenStr,
        sourceAmount: result.sourceAmount,
        sourceAmountFormatted: `${result.sourceAmount.toFixed(8)} ${
          result.feeCalculation.tokenSymbol
        }`,
        idrxAmount: idrxAmountNum,
        idrxAmountFormatted: formatCurrency(idrxAmountNum, "IDR"),
        logoUrl,
        fees: {
          ...result.feeCalculation,
          adminFeePercentageFormatted: `${(
            result.feeCalculation.adminFeePercentage * 100
          ).toFixed(2)}%`,
          spreadFeePercentageFormatted: `${(
            result.feeCalculation.spreadFeePercentage * 100
          ).toFixed(2)}%`,
          totalFeePercentageFormatted: `${(
            result.feeCalculation.totalFeePercentage * 100
          ).toFixed(2)}%`,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate volatility and recommended spread fee
   */
  public async calculateVolatility(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = req.params.token || "eth";
      const days = parseInt(req.query.days as string) || 1;

      const result = await tokenFeeService.calculateVolatility(token, days);
      const logoUrl = getTokenLogoUrl(token) || getTokenLogoUrl(result.token);

      res.status(200).json({
        success: true,
        ...result,
        logoUrl,
        volatilityPercentage: `${(result.volatility * 100).toFixed(2)}%`,
        recommendedSpreadFeePercentage: `${(
          result.recommendedSpreadFee * 100
        ).toFixed(2)}%`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get list of supported tokens
   */
  public getSupportedTokens(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tokens = tokenFeeService.getSupportedTokens();

      const tokensWithLogos = tokens.map((token) => ({
        ...token,
        logoUrl: getTokenLogoUrl(token.symbol.toLowerCase()),
      }));

      res.status(200).json({
        success: true,
        tokens: tokensWithLogos,
      });
    } catch (error) {
      next(error);
    }

    return Promise.resolve();
  }

  /**
   * Get list of supported tokens grouped by network
   */
  public getSupportedTokensByNetwork(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tokensByNetwork = tokenFeeService.getSupportedTokensByNetwork();

      const networksWithLogos = tokensByNetwork.map((network) => {
        const networkConfig =
          NETWORKS[network.network as keyof typeof NETWORKS];
        const networkLogoUrl = getNetworkLogoUrl(network.network);

        const tokensWithLogos = network.tokens.map((symbol) => {
          const tokenInfo = getTokenInfoBySymbol(symbol);
          const mainnetAddress = getTokenAddress(
            network.network,
            symbol,
            false
          );
          const testnetAddress = getTokenAddress(network.network, symbol, true);

          return {
            symbol,
            name: tokenInfo?.name || symbol.toUpperCase(),
            logoUrl: tokenInfo?.logoUrl || undefined,
            addresses: {
              mainnet: mainnetAddress,
              testnet: testnetAddress,
            },
          };
        });

        return {
          network: network.network,
          networkName: networkConfig?.name || network.network,
          logoUrl: networkLogoUrl,
          rpcUrls: {
            mainnet: networkConfig?.mainnetRpcUrl,
            testnet: networkConfig?.testnetRpcUrl,
          },
          chainIds: {
            mainnet: networkConfig?.mainnetChainId,
            testnet: networkConfig?.testnetChainId,
          },
          tokens: tokensWithLogos,
        };
      });

      res.status(200).json({
        success: true,
        networks: networksWithLogos,
      });
    } catch (error) {
      next(error);
    }

    return Promise.resolve();
  }

  /**
   * Get supported networks with their configuration
   */
  public getSupportedNetworks(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const networkIds = getSupportedNetworks();

      const networks = networkIds.map((id) => {
        const network = NETWORKS[id as keyof typeof NETWORKS];
        return {
          id,
          name: network.name,
          logoUrl: network.logoUrl,
          nativeCurrency: network.nativeCurrency,
          mainnetChainId: network.mainnetChainId,
          testnetChainId: network.testnetChainId,
        };
      });

      res.status(200).json({
        success: true,
        networks,
      });
    } catch (error) {
      next(error);
    }

    return Promise.resolve();
  }

  /**
   * Get supported tokens for a specific network
   */
  public getNetworkTokens(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { network } = req.params;
      const tokens = getSupportedTokensForNetwork(network);

      const tokenDetails = tokens.map((symbol) => {
        const info = getTokenInfoBySymbol(symbol);
        const mainnetAddress = getTokenAddress(network, symbol, false);
        const testnetAddress = getTokenAddress(network, symbol, true);

        return {
          symbol,
          name: info?.name || symbol.toUpperCase(),
          id: info?.id || normalizeTokenId(symbol),
          logoUrl: info?.logoUrl || undefined,
          addresses: {
            mainnet: mainnetAddress,
            testnet: testnetAddress,
          },
        };
      });

      const networkInfo = NETWORKS[network as keyof typeof NETWORKS];

      res.status(200).json({
        success: true,
        network,
        networkName: networkInfo?.name || network,
        networkLogoUrl: networkInfo?.logoUrl,
        rpcUrls: {
          mainnet: networkInfo?.mainnetRpcUrl,
          testnet: networkInfo?.testnetRpcUrl,
        },
        chainIds: {
          mainnet: networkInfo?.mainnetChainId,
          testnet: networkInfo?.testnetChainId,
        },
        tokens: tokenDetails,
      });
    } catch (error) {
      next(error);
    }

    return Promise.resolve();
  }
}

export default new TokenFeeController();
