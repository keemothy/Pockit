export const CARD_CATALOG_SOURCE = {
  name: 'credit-card-bonuses-api',
  url: 'https://raw.githubusercontent.com/andenacitelli/credit-card-bonuses-api/main/exports/data.json',
  repository: 'https://github.com/andenacitelli/credit-card-bonuses-api',
  refreshCadence: 'daily',
  license: 'MIT with Commons Clause',
} as const;

type CatalogOffer = {
  spend: number;
  amount: Array<{ amount: number }>;
  days: number;
};

type CatalogCardSource = {
  cardId: string;
  name: string;
  issuer: string;
  network: string;
  currency: string;
  isBusiness: boolean;
  annualFee: number;
  isAnnualFeeWaived: boolean;
  universalCashbackPercent: number;
  url: string;
  imageUrl: string;
  offers: CatalogOffer[];
  discontinued: boolean;
};

export type CardCatalogEntry = Pick<
  CatalogCardSource,
  | 'cardId'
  | 'name'
  | 'issuer'
  | 'network'
  | 'currency'
  | 'isBusiness'
  | 'annualFee'
  | 'isAnnualFeeWaived'
  | 'universalCashbackPercent'
  | 'url'
  | 'imageUrl'
  | 'offers'
>;

function normalizeCardName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function displayIssuerName(issuer: string): string {
  const trimmedIssuer = issuer.trim();
  if (trimmedIssuer !== trimmedIssuer.toUpperCase()) return trimmedIssuer;
  return trimmedIssuer.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function displayCatalogCardName(card: Pick<CardCatalogEntry, 'issuer' | 'name'>): string {
  const issuer = displayIssuerName(card.issuer);
  return card.name.toLowerCase().startsWith(issuer.toLowerCase())
    ? card.name
    : `${issuer} ${card.name}`;
}

function isCatalogCard(value: unknown): value is CatalogCardSource {
  if (typeof value !== 'object' || value === null) return false;
  const card = value as Partial<CatalogCardSource>;

  return (
    typeof card.cardId === 'string' &&
    typeof card.name === 'string' &&
    typeof card.issuer === 'string' &&
    typeof card.discontinued === 'boolean'
  );
}

/**
 * Fetches a read-only card catalog for card selection and sign-up-bonus display.
 * It intentionally does not provide category multipliers; those live in
 * data/reward-rules.json and must cite each issuer's official card page.
 */
export async function getCardCatalog(): Promise<CardCatalogEntry[]> {
  const response = await fetch(CARD_CATALOG_SOURCE.url, {
    next: { revalidate: 86_400 },
  });

  if (!response.ok) {
    throw new Error(`Unable to load card catalog: ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error('Card catalog returned an unexpected response.');
  }

  return payload.filter(isCatalogCard).filter((card) => !card.discontinued);
}

/**
 * Plaid account names are institution-provided and can differ from a card's
 * marketing name. Exact normalized matches are preferred; partial matches are
 * allowed only when at least eight characters overlap.
 */
export function findCatalogCard(
  accountNames: Array<string | null | undefined>,
  catalog: CardCatalogEntry[],
): CardCatalogEntry | undefined {
  const candidates = accountNames
    .filter((name): name is string => Boolean(name?.trim()))
    .map(normalizeCardName);

  return catalog.find((card) => {
    const cardNames = [card.name, displayCatalogCardName(card)].map(normalizeCardName);
    return candidates.some(
      (candidate) =>
        cardNames.some((catalogName) => candidate === catalogName ||
          (candidate.length >= 8 &&
            (candidate.includes(catalogName) || catalogName.includes(candidate)))),
    );
  });
}
