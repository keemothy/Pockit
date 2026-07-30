import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

export type PlaidEnvironment = "sandbox" | "development" | "production";

export function getPlaidEnvironment(): PlaidEnvironment {
  const environment = process.env.PLAID_ENV ?? "sandbox";
  if (environment === "production" || environment === "development") return environment;
  return "sandbox";
}

const environment = getPlaidEnvironment();

const plaidEnvironment =
  environment === "production"
    ? PlaidEnvironments.production
    : environment === "development"
      ? PlaidEnvironments.development
      : PlaidEnvironments.sandbox;

export const plaidClient = new PlaidApi(
  new Configuration({
    basePath: plaidEnvironment,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID ?? "",
        "PLAID-SECRET": process.env.PLAID_SECRET ?? "",
      },
    },
  }),
);

export function hasPlaidCredentials() {
  return Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}
