const jwt = require("jsonwebtoken");

const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Not admin" });
    }

    req.admin = decoded; // Attach admin info to request
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
    
  }
};

// Exporting the middleware function
module.exports = verifyAdmin;
