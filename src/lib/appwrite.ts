import { Client, Account, Databases } from "appwrite";

const client = new Client();

client
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("ag-suite03"); // Suite project

export const account = new Account(client);
export const databases = new Databases(client);

export default client;
