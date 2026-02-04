import { Client, Account, Databases } from "appwrite";

const client = new Client();

// IMPORTANT: keep endpoint/projectId driven by env so preview/prod are consistent.
// Falls back to the previous hardcoded defaults.
const endpoint =
  (import.meta as any).env?.VITE_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1";
const projectId = (import.meta as any).env?.VITE_APPWRITE_PROJECT_ID ?? "ag-suite03";

client.setEndpoint(endpoint).setProject(projectId); // Suite project

export const account = new Account(client);
export const databases = new Databases(client);

export default client;
