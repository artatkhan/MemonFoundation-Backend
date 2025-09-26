const express = require("express");
const authRoute = require("./routes/authRoute");
const userRoute = require("./routes/userRoute");
const uploadRoute = require("./routes/uploadRoutes");
const tenantRoute = require("./routes/tenantRoute");
const documentRoute = require("./routes/documents.Route");
const documentTypeRoute = require("./routes/documentType.Route");
const { logger } = require("./utils/logger");
const morgan = require("morgan")

const app = express();
const cors = require("cors");
require("dotenv").config();
require("./config/database");
const PORTAL_PORT = process.env.PORTAL_PORT;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/upload", uploadRoute);
app.use("/api/tenants", tenantRoute);
app.use("/api/upload", uploadRoute);
app.use("/api/document-types", documentTypeRoute);
app.use("/api/documents", documentRoute);

app.listen(PORTAL_PORT, () => {
  logger.log({
    level: "info",
    message: `Backend server is running on PORTAL_PORT ${PORTAL_PORT}`,
  });
});
