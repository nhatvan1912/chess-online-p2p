// Middleware kiểm tra authentication
const authMiddleware = (req, res, next) => {
  if (req.session && req.session.playerId) {
    next();
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Vui lòng đăng nhập' 
    });
  }
};

module.exports = authMiddleware;
