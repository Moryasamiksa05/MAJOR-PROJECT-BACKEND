

// module.exports = verifyToken;
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(" Authorization Header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: Please sign in" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); //  JWT verify
    if (!decoded.id) {
      console.error(" JWT is missing user ID");
      return res.status(403).json({ message: "Invalid Token: Missing user ID" });
    }

    req.user = { id: decoded.id, email: decoded.email };  //  Ensure id is assigned
    console.log(" Decoded Token:", req.user);
    next();
  } catch (err) {
    console.error(" JWT verification failed:", err.message);
    return res.status(403).json({ message: "Invalid Token" });
  }
};

module.exports = verifyToken;

