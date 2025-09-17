const mongoose = require("mongoose");
require("dotenv").config();
const { logger } = require("../utils/logger")

const mongoDB = mongoose.connect(process.env.MONGO_URL)
  .then(() => logger.log({
    level: 'info',
    message: `DB Connection Successfull`
  }))
  .catch((err) => {
    logger.log({
      level: 'warn',
      message: err.message
    })
  });

module.exports = mongoDB;