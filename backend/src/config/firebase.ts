import admin from "firebase-admin";

let credential;

if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  credential = admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  });
} else {
  try {
    const serviceAccount = require("../../firebase-service-account.json");
    credential = admin.credential.cert(serviceAccount as admin.ServiceAccount);
  } catch (error) {
    console.error("Firebase admin credential initialization failed. Make sure either env variables are set or firebase-service-account.json exists.");
    throw error;
  }
}

admin.initializeApp({
  credential,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "supplement-store-eeb5b.appspot.com",
});

export default admin;
