const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  let expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 60);

  res.cookie('token', token, {
    expires: new Date(process.env.JWT_COOKIE_EXPIRES_IN * expiresAt),
    httpOnly: true,
    // secure: true,
    sameSite: 'none',
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    user,
  });
};
