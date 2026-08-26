import { Client, Account, Databases, Storage, Teams, Functions, ID } from "appwrite";

const client = new Client();

export const APPWRITE_ENDPOINT =
  (import.meta as any).env?.VITE_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1";
export const APPWRITE_PROJECT_ID =
  (import.meta as any).env?.VITE_APPWRITE_PROJECT_ID ?? "ag-suite03";
export const APPWRITE_DB_ID =
  (import.meta as any).env?.VITE_DB_ID ?? (import.meta as any).env?.VITE_ACS_DATABASE_ID ?? "agsuite-db2";

client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const appwriteTeams = new Teams(client);
export const teams = appwriteTeams;
export const functions = new Functions(client);

export { Client, Account, Databases, Storage, Teams, Functions, ID };

export default client;
