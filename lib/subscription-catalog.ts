export type PopularSubscriptionCategory = {
  id: string;
  label: string;
  services: { name: string; merchantKeywords: string[] }[];
};

export const POPULAR_SUBSCRIPTION_CATEGORIES: PopularSubscriptionCategory[] = [
  { id: "video", label: "Video & streaming", services: [
    { name: "Netflix", merchantKeywords: ["NETFLIX"] }, { name: "Disney+", merchantKeywords: ["DISNEY"] },
    { name: "Hulu", merchantKeywords: ["HULU"] }, { name: "Max", merchantKeywords: ["HBO", "HBOMAX", "MAX.COM"] },
    { name: "YouTube Premium", merchantKeywords: ["YOUTUBE"] }, { name: "Amazon Prime Video", merchantKeywords: ["AMAZON PRIME", "PRIME VIDEO"] },
    { name: "Apple TV+", merchantKeywords: ["APPLE.COM/BILL", "ITUNES"] }, { name: "Peacock", merchantKeywords: ["PEACOCK"] },
    { name: "Paramount+", merchantKeywords: ["PARAMOUNT"] },
  ] },
  { id: "music", label: "Music & audio", services: [
    { name: "Spotify Premium", merchantKeywords: ["SPOTIFY"] }, { name: "Apple Music", merchantKeywords: ["APPLE.COM/BILL", "ITUNES"] },
    { name: "YouTube Music", merchantKeywords: ["YOUTUBE"] }, { name: "Audible", merchantKeywords: ["AUDIBLE"] },
    { name: "Pandora", merchantKeywords: ["PANDORA"] }, { name: "SiriusXM", merchantKeywords: ["SIRIUS"] },
  ] },
  { id: "productivity", label: "Cloud & productivity", services: [
    { name: "iCloud+", merchantKeywords: ["ICLOUD", "APPLE.COM/BILL"] }, { name: "Google One", merchantKeywords: ["GOOGLE ONE"] },
    { name: "Dropbox", merchantKeywords: ["DROPBOX"] }, { name: "Microsoft 365", merchantKeywords: ["MICROSOFT 365"] },
    { name: "Adobe Creative Cloud", merchantKeywords: ["ADOBE"] }, { name: "Canva Pro", merchantKeywords: ["CANVA"] },
    { name: "Notion", merchantKeywords: ["NOTION"] }, { name: "ChatGPT Plus", merchantKeywords: ["OPENAI", "CHATGPT"] },
  ] },
  { id: "wellness", label: "Fitness & wellness", services: [
    { name: "Peloton", merchantKeywords: ["PELOTON"] }, { name: "ClassPass", merchantKeywords: ["CLASSPASS"] },
    { name: "Headspace", merchantKeywords: ["HEADSPACE"] }, { name: "Calm", merchantKeywords: ["CALM"] },
    { name: "Strava", merchantKeywords: ["STRAVA"] }, { name: "MyFitnessPal Premium", merchantKeywords: ["MYFITNESSPAL"] },
  ] },
  { id: "gaming", label: "Gaming", services: [
    { name: "PlayStation Plus", merchantKeywords: ["PLAYSTATION"] }, { name: "Xbox Game Pass", merchantKeywords: ["XBOX", "MICROSOFT"] },
    { name: "Nintendo Switch Online", merchantKeywords: ["NINTENDO"] }, { name: "Discord Nitro", merchantKeywords: ["DISCORD"] },
  ] },
  { id: "shopping", label: "Shopping & membership", services: [
    { name: "Amazon Prime", merchantKeywords: ["AMAZON PRIME"] }, { name: "Costco Membership", merchantKeywords: ["COSTCO"] },
    { name: "Walmart+", merchantKeywords: ["WALMART+"] }, { name: "Instacart+", merchantKeywords: ["INSTACART"] },
    { name: "DoorDash DashPass", merchantKeywords: ["DOORDASH"] }, { name: "Uber One", merchantKeywords: ["UBER ONE"] },
  ] },
  { id: "news", label: "News & learning", services: [
    { name: "The New York Times", merchantKeywords: ["NEW YORK TIMES", "NYTIMES"] }, { name: "The Wall Street Journal", merchantKeywords: ["WALL STREET JOURNAL", "WSJ"] },
    { name: "Duolingo Super", merchantKeywords: ["DUOLINGO"] }, { name: "Coursera Plus", merchantKeywords: ["COURSERA"] },
    { name: "MasterClass", merchantKeywords: ["MASTERCLASS"] },
  ] },
];

export const KNOWN_SUBSCRIPTION_MERCHANT_KEYWORDS = POPULAR_SUBSCRIPTION_CATEGORIES
  .flatMap((category) => category.services.flatMap((service) => service.merchantKeywords));

export function matchesKnownSubscriptionMerchant(merchantName: string) {
  const normalizedMerchant = merchantName.toUpperCase();
  return KNOWN_SUBSCRIPTION_MERCHANT_KEYWORDS.some((keyword) => normalizedMerchant.includes(keyword));
}
