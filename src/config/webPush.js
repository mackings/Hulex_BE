const webpush = require('web-push');

let configured = false;
let attempted = false;

function getPublicKey() {
  return process.env.WEB_PUSH_VAPID_PUBLIC_KEY || '';
}

function getPrivateKey() {
  return process.env.WEB_PUSH_VAPID_PRIVATE_KEY || '';
}

function getContactEmail() {
  return process.env.WEB_PUSH_CONTACT_EMAIL || 'mailto:support@hulex.app';
}

function ensureWebPushConfigured() {
  if (configured) {
    return true;
  }

  if (attempted) {
    return false;
  }

  attempted = true;

  const publicKey = getPublicKey();
  const privateKey = getPrivateKey();

  if (!publicKey || !privateKey) {
    console.warn('Web Push not configured. Set WEB_PUSH_VAPID_PUBLIC_KEY and WEB_PUSH_VAPID_PRIVATE_KEY.');
    return false;
  }

  try {
    webpush.setVapidDetails(getContactEmail(), publicKey, privateKey);
    configured = true;
    console.log('✓ Web Push configured');
    return true;
  } catch (error) {
    console.error('Web Push configuration failed:', error.message);
    return false;
  }
}

function getWebPushClient() {
  if (!ensureWebPushConfigured()) {
    return null;
  }

  return webpush;
}

function getWebPushPublicConfig() {
  const publicKey = getPublicKey();

  return {
    supported: Boolean(ensureWebPushConfigured() && publicKey),
    publicKey
  };
}

module.exports = {
  getWebPushClient,
  getWebPushPublicConfig,
  ensureWebPushConfigured
};
