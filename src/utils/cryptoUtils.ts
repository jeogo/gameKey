/**
 * Enhanced crypto currency handling utilities
 */

export interface CryptoVariant {
  symbol: string;
  name: string;
  network: string;
  priority: number; // Lower number = higher priority
  isStablecoin: boolean;
  averageConfirmationTime: number; // in minutes
}

/**
 * Comprehensive USDT variants with priority ordering
 */
export const USDT_VARIANTS: CryptoVariant[] = [
  {
    symbol: 'usdterc20',
    name: 'USDT (ERC-20)',
    network: 'Ethereum',
    priority: 1,
    isStablecoin: true,
    averageConfirmationTime: 15,
  },
  {
    symbol: 'usdttrc20',
    name: 'USDT (TRC-20)',
    network: 'TRON',
    priority: 2,
    isStablecoin: true,
    averageConfirmationTime: 3,
  },
  {
    symbol: 'usdtbsc',
    name: 'USDT (BEP-20)',
    network: 'BSC',
    priority: 3,
    isStablecoin: true,
    averageConfirmationTime: 5,
  },
  {
    symbol: 'usdtmatic',
    name: 'USDT (Polygon)',
    network: 'Polygon',
    priority: 4,
    isStablecoin: true,
    averageConfirmationTime: 2,
  },
  {
    symbol: 'usdtsol',
    name: 'USDT (Solana)',
    network: 'Solana',
    priority: 5,
    isStablecoin: true,
    averageConfirmationTime: 1,
  },
];

/**
 * Other reliable cryptocurrencies with fallback priority
 */
export const FALLBACK_CURRENCIES: CryptoVariant[] = [
  {
    symbol: 'btc',
    name: 'Bitcoin',
    network: 'Bitcoin',
    priority: 10,
    isStablecoin: false,
    averageConfirmationTime: 60,
  },
  {
    symbol: 'eth',
    name: 'Ethereum',
    network: 'Ethereum',
    priority: 11,
    isStablecoin: false,
    averageConfirmationTime: 15,
  },
  {
    symbol: 'ltc',
    name: 'Litecoin',
    network: 'Litecoin',
    priority: 12,
    isStablecoin: false,
    averageConfirmationTime: 30,
  },
  {
    symbol: 'bnb',
    name: 'BNB',
    network: 'BSC',
    priority: 13,
    isStablecoin: false,
    averageConfirmationTime: 5,
  },
];

/**
 * Get the best available currency based on user preference and availability
 */
export function getBestAvailableCurrency(
  userPreference: string,
  availableCurrencies: string[]
): CryptoVariant | null {
  const preferredLower = userPreference.toLowerCase();

  // First, check if user's exact preference is available
  const allVariants = [...USDT_VARIANTS, ...FALLBACK_CURRENCIES];
  const exactMatch = allVariants.find(
    variant => variant.symbol === preferredLower && availableCurrencies.includes(variant.symbol)
  );

  if (exactMatch) {
    return exactMatch;
  }

  // If user wants USDT, find the best USDT variant
  if (preferredLower === 'usdt' || preferredLower.includes('usdt')) {
    const availableUsdtVariants = USDT_VARIANTS.filter(variant =>
      availableCurrencies.includes(variant.symbol)
    ).sort((a, b) => a.priority - b.priority);

    if (availableUsdtVariants.length > 0) {
      return availableUsdtVariants[0]; // Return highest priority USDT
    }
  }

  // Fallback to any available currency, prioritized
  const availableFallbacks = [...USDT_VARIANTS, ...FALLBACK_CURRENCIES]
    .filter(variant => availableCurrencies.includes(variant.symbol))
    .sort((a, b) => a.priority - b.priority);

  return availableFallbacks.length > 0 ? availableFallbacks[0] : null;
}

/**
 * Get user-friendly currency display information
 */
export function getCurrencyDisplayInfo(currencySymbol: string): string {
  const allVariants = [...USDT_VARIANTS, ...FALLBACK_CURRENCIES];
  const variant = allVariants.find(v => v.symbol === currencySymbol);

  if (variant) {
    return `${variant.name} (${variant.network})`;
  }

  return currencySymbol.toUpperCase();
}

/**
 * Validate if a currency is supported for payments
 */
export function isSupportedCurrency(currencySymbol: string): boolean {
  const allVariants = [...USDT_VARIANTS, ...FALLBACK_CURRENCIES];
  return allVariants.some(variant => variant.symbol === currencySymbol.toLowerCase());
}

/**
 * Get recommended currencies for different user types
 */
export function getRecommendedCurrencies(
  userType: 'beginner' | 'experienced' = 'beginner'
): CryptoVariant[] {
  if (userType === 'beginner') {
    // Recommend stable, well-known currencies for beginners
    return [
      USDT_VARIANTS[1], // USDT TRC-20 (fast and cheap)
      USDT_VARIANTS[0], // USDT ERC-20 (most common)
      FALLBACK_CURRENCIES[0], // Bitcoin (most trusted)
    ];
  } else {
    // Experienced users get all options sorted by efficiency
    return [...USDT_VARIANTS, ...FALLBACK_CURRENCIES].sort(
      (a, b) => a.averageConfirmationTime - b.averageConfirmationTime
    );
  }
}
