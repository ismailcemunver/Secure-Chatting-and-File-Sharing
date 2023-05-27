const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
  try {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, "cse492");
    req.token = decoded;
    //to reach user id => req.token.userId
    next();
  } catch {
    res.redirect("/login");
  }
};
