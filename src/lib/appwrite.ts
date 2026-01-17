import { Client, Account } from "appwrite";

const client = new Client();

client
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("ag-suite03"); // MUST match the project you configured OAuth in

export const account = new Account(client);
