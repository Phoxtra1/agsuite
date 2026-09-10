import { Client, Account, Databases, Storage, Teams, Functions, ID } from "appwrite";

const client = new Client();

const SELF_HOST_ENDPOINT = "https://cloud.phoxtra.com/v1";

const configuredEndpoint =
  (import.meta as any).env?.VITE_APPWRITE_ENDPOINT || SELF_HOST_ENDPOINT;

// Hard guard: never talk to Appwrite Cloud, even if a stale deploy variable
// points there — that is what caused the old billing/auth failures.
export const APPWRITE_ENDPOINT = /appwrite\.io/i.test(configuredEndpoint)
  ? SELF_HOST_ENDPOINT
  : configuredEndpoint;

const configuredProject =
  (import.meta as any).env?.VITE_APPWRITE_PROJECT_ID || "amineva";

export const APPWRITE_PROJECT_ID = /ag-suite/i.test(configuredProject)
  ? "amineva"
  : configuredProject;

export const APPWRITE_DB_ID =
  (import.meta as any).env?.VITE_DB_ID || "amineva-db";

client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const appwriteTeams = new Teams(client);
export const teams = appwriteTeams;
export const functions = new Functions(client);

export { Client, Account, Databases, Storage, Teams, Functions, ID };

export default client;
