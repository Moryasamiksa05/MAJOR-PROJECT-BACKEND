// const admin = require("firebase-admin");
// const serviceAccount = require("./serviceAccountKey.json"); // Firebase console se download karo

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// module.exports = admin;
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize only if no app is initialized already
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
