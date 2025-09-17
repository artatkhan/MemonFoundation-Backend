const express = require("express");
const authRoute = require("./routes/authRoute");
const userRoute = require("./routes/userRoute");
const uploadRoute = require("./routes/uploadRoutes");
const tenantRoute = require("./routes/tenantRoute");
const { logger } = require("./utils/logger");
const morgan = require("morgan")

const app = express();
const cors = require("cors");
require("dotenv").config();
require("./config/database");

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/upload", uploadRoute);
app.use("/api/tenants", tenantRoute);

app.listen(process.env.PORT || 5000, () => {
  logger.log({
    level: "info",
    message: `Backend server is running on port ${process.env.PORT}`,
  });
});
