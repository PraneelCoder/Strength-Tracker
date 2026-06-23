const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const tokenHeader = req.header('Authorization');

  if (!tokenHeader) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const token = tokenHeader.startsWith('Bearer ') ? tokenHeader.split(' ')[1] : tokenHeader;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};