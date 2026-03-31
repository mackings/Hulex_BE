const admin = require('firebase-admin');

let firebaseApp = null;
let initAttempted = false;

function normalizePrivateKey(privateKey) {
  if (!privateKey) return privateKey;
  return privateKey.replace(/\\n/g, '\n');
}

function buildServiceAccountFromEnv() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      if (parsed.private_key) {
        parsed.private_key = normalizePrivateKey(parsed.private_key);
      }
      return parsed;
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) return null;

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey
  };
}

function initializeFirebaseAdmin() {
  if (firebaseApp) return firebaseApp;
  if (initAttempted) return null;

  initAttempted = true;

  try {
    const serviceAccount = buildServiceAccountFromEnv();

    if (serviceAccount) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✓ Firebase Admin initialized');
      return firebaseApp;
    }

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      console.log('✓ Firebase Admin initialized via GOOGLE_APPLICATION_CREDENTIALS');
      return firebaseApp;
    }

    console.warn(
      'Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.'
    );
    return null;
  } catch (err) {
    console.error('Firebase Admin initialization failed:', err.message);
    return null;
  }
}

function getFirebaseMessaging() {
  const app = initializeFirebaseAdmin();
  if (!app) return null;
  return admin.messaging(app);
}

module.exports = {
  getFirebaseMessaging
};
