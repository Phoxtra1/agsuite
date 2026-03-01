import { Client, Account, Databases, ID, Teams } from "appwrite";

const client = new Client();

const endpoint =
  (import.meta as any).env?.VITE_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1";
const projectId = (import.meta as any).env?.VITE_APPWRITE_PROJECT_ID ?? "ag-suite03";

client.setEndpoint(endpoint).setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const appwriteTeams = new Teams(client);
export { ID };

export default client;
