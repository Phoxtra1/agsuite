import express from "express";
import employeeRoutes from "./employee.js";
const app = express();
app.use(express.json());

// Mount employee routes
app.use("/api/employee", employeeRoutes);
export default app;
