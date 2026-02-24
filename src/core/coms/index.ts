import * as AppwriteComs from "./adapters/appwrite/coms";
import * as LoveableComs from "./adapters/lovable/coms";

const adapter = process.env.COMS_ADAPTER || "loveable"; // or "appwrite"

export const Coms = adapter === "appwrite" ? AppwriteComs : LoveableComs;
