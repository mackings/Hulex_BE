const User = require('../models/userModel');
const { getFirebaseMessaging } = require('../config/firebaseAdmin');
const { getWebPushClient } = require('../config/webPush');

const MAX_MULTICAST_TOKENS = 500;
const INVALID_FCM_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
  'messaging/invalid-argument'
]);
const WEB_PUSH_GONE_STATUS_CODES = new Set([404, 410]);

function getProviderLogoPath(provider) {
  const alias = String(provider?.alias || provider?.name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  switch (alias) {
    case 'sendwave':
      return '/provider-logos/sendwave-wordmark.svg';
    case 'taptapsend':
      return '/provider-logos/taptapsend.avif';
    case 'instarem':
      return '/provider-logos/instarem-wordmark.png';
    case 'wise':
      return '/provider-logos/wise.svg';
    case 'remitly':
      return '/provider-logos/remitly.png';
    case 'worldremit':
      return '/provider-logos/worldremit.png';
    default:
      return '';
  }
}

function buildWebPushPayload(payload) {
  const inferredType = payload.data?.type || 'rate_alert';
  const url = payload.url || (inferredType === 'rate_digest' ? '/compare' : '/dashboard');
  const icon = payload.icon || getProviderLogoPath(payload.provider);

  return JSON.stringify({
    title: payload.title,
    body: payload.body,
    tag: payload.tag || `hulex-${inferredType}`,
    icon: icon || undefined,
    url,
    data: payload.data || {}
  });
}

async function sendFcmToUser(user, payload) {
  if (!user?.pushTokens?.length) {
    return { success: false, reason: 'No push tokens registered' };
  }

  const messaging = getFirebaseMessaging();
  if (!messaging) {
    return { success: false, reason: 'Firebase Admin not configured' };
  }

  const allTokens = [...new Set(user.pushTokens.map(t => t.token).filter(Boolean))];
  if (!allTokens.length) {
    return { success: false, reason: 'No valid push tokens registered' };
  }

  const invalidTokens = [];
  let sentCount = 0;
  let failedCount = 0;

  for (let i = 0; i < allTokens.length; i += MAX_MULTICAST_TOKENS) {
    const chunk = allTokens.slice(i, i + MAX_MULTICAST_TOKENS);

    try {
      const response = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: {
          title: payload.title,
          body: payload.body
        },
        data: payload.data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: payload.androidChannelId || 'rate_alerts'
          }
        },
        apns: {
          headers: {
            'apns-priority': '10'
          }
        }
      });

      sentCount += response.successCount;
      failedCount += response.failureCount;

      response.responses.forEach((result, index) => {
        if (result.success) return;
        const code = result.error?.code;
        if (INVALID_FCM_TOKEN_CODES.has(code)) {
          invalidTokens.push(chunk[index]);
        }
      });
    } catch (err) {
      failedCount += chunk.length;
      console.error('FCM send chunk failed:', err.message);
    }
  }

  if (invalidTokens.length) {
    await User.updateOne(
      { _id: user._id },
      { $pull: { pushTokens: { token: { $in: invalidTokens } } } }
    );
  }

  return {
    success: sentCount > 0,
    reason: sentCount > 0 ? null : 'All push deliveries failed',
    sentCount,
    failedCount,
    removedInvalidTokens: invalidTokens.length
  };
}

async function sendWebPushToUser(user, payload) {
  const removeInvalidSubscriptions = async (invalidEndpoints) => {
    if (!invalidEndpoints.length || !user?._id) {
      return;
    }

    await User.updateOne(
      { _id: user._id },
      { $pull: { webPushSubscriptions: { endpoint: { $in: invalidEndpoints } } } }
    );
  };

  return sendWebPushToSubscriptions(user?.webPushSubscriptions, payload, {
    removeInvalidSubscriptions
  });
}

async function sendWebPushToSubscriptions(subscriptions, payload, options = {}) {
  if (!subscriptions?.length) {
    return { success: false, reason: 'No web push subscriptions registered' };
  }

  const webPush = getWebPushClient();
  if (!webPush) {
    return { success: false, reason: 'Web Push not configured' };
  }

  const invalidEndpoints = [];
  let sentCount = 0;
  let failedCount = 0;
  const uniqueSubscriptions = new Map();

  for (const subscription of subscriptions) {
    if (subscription?.endpoint) {
      uniqueSubscriptions.set(subscription.endpoint, subscription);
    }
  }

  for (const subscription of uniqueSubscriptions.values()) {
    try {
      await webPush.sendNotification(subscription, buildWebPushPayload(payload));
      sentCount += 1;
    } catch (error) {
      failedCount += 1;
      if (WEB_PUSH_GONE_STATUS_CODES.has(error.statusCode)) {
        invalidEndpoints.push(subscription.endpoint);
      } else {
        console.error('Web Push send failed:', error.message);
      }
    }
  }

  if (invalidEndpoints.length && typeof options.removeInvalidSubscriptions === 'function') {
    await options.removeInvalidSubscriptions(invalidEndpoints);
  }

  return {
    success: sentCount > 0,
    reason: sentCount > 0 ? null : 'All web push deliveries failed',
    sentCount,
    failedCount,
    removedInvalidSubscriptions: invalidEndpoints.length
  };
}

async function sendPushToUser(user, payload) {
  const [fcmResult, webPushResult] = await Promise.all([
    sendFcmToUser(user, payload),
    sendWebPushToUser(user, payload)
  ]);

  return {
    success: Boolean(fcmResult.success || webPushResult.success),
    reason: fcmResult.success || webPushResult.success ? null : webPushResult.reason || fcmResult.reason,
    channels: {
      fcm: fcmResult,
      webPush: webPushResult
    }
  };
}

module.exports = {
  sendPushToUser,
  sendWebPushToSubscriptions
};
