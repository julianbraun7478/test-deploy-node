const admin = require("firebase-admin");

var serviceAccount = require("../firebaseServiceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;