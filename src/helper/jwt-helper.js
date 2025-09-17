const jwt = require("jsonwebtoken");

const jsonWeb = async (user, secret) => {
  const token = jwt.sign(
    {
      userId: user.id,
      type: user.type,
      username: user.username,
      email: user.email,
      tenantId: user.tenantId,
    },
    secret,
    { expiresIn: "24h" }
  );
  return `Bearer ${token}`;
};

module.exports = { jsonWeb };
