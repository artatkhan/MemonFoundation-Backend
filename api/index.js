const app = require("../src/index"); // Load Express app
const serverless = require("serverless-http");

module.exports = serverless(app); // Export as serverless function
