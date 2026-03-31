const User = require('../models/userModel');
const { getFirebaseMessaging } = require('../config/firebaseAdmin');

const MAX_MULTICAST_TOKENS = 500;
const INVALID_FCM_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
  'messaging/invalid-argument'
]);

async function sendPushToUser(user, payload) {
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

module.exports = {
  sendPushToUser
};
