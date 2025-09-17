const authService = require("../services/authService");

async function registeration(req, res) {
  const { status, ...data } = await authService.register(req, res);
  return res.status(status).send(data);
}

async function login(req, res) {
  const { status, ...data } = await authService.login(req, res);
  return res.status(status).send(data);
}

async function otpVerification(req, res) {
  const { status, ...data } = await authService.verifySource(req);
  return res.status(status).send(data);
}

module.exports = {
  registeration,
  login,
  otpVerification,
};
