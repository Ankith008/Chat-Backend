const jwt = require("jsonwebtoken");

const fetchuser = async (req, res, next) => {
  const token = req.header("authtoken");
  if (!token) {
    res.status(401).send("Please authenticate using a valid token");
  }
  try {
    const data = jwt.verify(token, process.env.SECRET_KEY);
    req.user = data.user;
    next();
  } catch (error) {
    res.status(404).send("Please Signup for further actions");
  }
};
module.exports = fetchuser;
