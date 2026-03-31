require('dotenv').config();

const fs = require('fs');
const mongoose = require('mongoose');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');
const AlertNotification = require('../src/models/alertNotificationModel');
const { runHourlyRatesDigest } = require('../src/services/hourlyRatesNotificationService');
const User = require('../src/models/userModel');

const TEST_EMAIL = 'codex-notify-test@hulex.local';
const TEST_PASSWORD = 'TestPass123!';
const FRONTEND_URL = 'http://localhost:3001';
const BACKEND_URL = 'http://localhost:1000';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
async function loginAndGetToken() {
  const response = await fetch(`${BACKEND_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
  });

  const payload = await response.json();
  if (!response.ok || !payload?.token) {
    throw new Error(`Login failed: ${payload?.error || response.statusText}`);
  }

  return payload.token;
}

async function cleanupExistingNotifications(userId) {
  await AlertNotification.deleteMany({
    userId,
    $or: [
      { kind: 'rate_digest' },
      { message: { $regex: /^Best rate now:/ } }
    ]
  });
}

async function resetUserWebPushSubscriptions(userId) {
  await User.updateOne(
    { _id: userId },
    { $set: { webPushSubscriptions: [] } }
  );
}

async function runDigestForBrowserTest(userId) {
  await cleanupExistingNotifications(userId);
  const result = await runHourlyRatesDigest();
  const notification = await AlertNotification.findOne({
    userId,
    kind: 'rate_digest'
  })
    .sort({ triggeredAt: -1 })
    .lean();

  if (!notification) {
    throw new Error('Digest ran but no rate_digest notification was created for the test user');
  }

  return { result, notificationId: notification._id };
}

async function main() {
  let context;
  let page;
  let digestNotificationId;
  let userId;
  let userDataDir;
  const observedApiRequests = new Set();
  const directBackendRequests = new Set();

  try {
    console.log('1. Logging in test user...');
    const token = await loginAndGetToken();

    console.log('2. Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: TEST_EMAIL }).select('_id').lean();
    if (!user) {
      throw new Error('Test user not found in MongoDB');
    }
    userId = user._id;
    await resetUserWebPushSubscriptions(userId);

    console.log('3. Launching Chrome...');
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hulex-web-push-'));
    context = await chromium.launchPersistentContext(userDataDir, {
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox'],
      permissions: ['notifications']
    });

    console.log('4. Creating browser context...');

    await context.addCookies([
      {
        name: 'hulex_session',
        value: token,
        url: FRONTEND_URL,
        httpOnly: true,
        sameSite: 'Lax'
      }
    ]);

    console.log('5. Opening dashboard...');
    page = await context.newPage();
    page.setDefaultTimeout(20000);
    page.on('request', (request) => {
      const url = request.url();

      if (url.startsWith(`${FRONTEND_URL}/api/`)) {
        observedApiRequests.add(url.replace(FRONTEND_URL, ''));
      }

      if (url.startsWith(BACKEND_URL)) {
        directBackendRequests.add(url);
      }
    });
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Enable browser alerts', { timeout: 15000 });

    console.log('6. Enabling browser alerts...');
    await page.click('text=Enable browser alerts');
    await page.waitForFunction(
      () =>
        window.localStorage.getItem('hulex-browser-notifications-enabled') === 'true' &&
        window.localStorage.getItem('hulex-browser-notifications-mode') === 'web-push',
      null,
      { timeout: 20000 }
    );

    const enableState = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      const cache = await caches.open('hulex-web-push-cache-v1');
      await cache.delete('/__hulex_last_push__');

      return {
        permission: Notification.permission,
        enabled: window.localStorage.getItem('hulex-browser-notifications-enabled'),
        mode: window.localStorage.getItem('hulex-browser-notifications-mode'),
        subscriptionEndpoint: subscription?.endpoint || ''
      };
    });
    console.log(
      `   permission=${enableState.permission} enabled=${enableState.enabled} mode=${enableState.mode}`
    );

    if (enableState.mode !== 'web-push' || !enableState.subscriptionEndpoint) {
      throw new Error('Web push subscription was not registered in the browser');
    }

    const subscribedUser = await User.findById(userId).select('webPushSubscriptions').lean();
    const dbSubscription = subscribedUser?.webPushSubscriptions?.find(
      (item) => item.endpoint === enableState.subscriptionEndpoint
    );
    if (!dbSubscription) {
      throw new Error('Web push subscription was not stored in MongoDB');
    }

    console.log('7. Closing the page to simulate leaving the site...');
    await page.close();
    page = null;

    console.log('8. Running the real 5-hour digest service...');
    const digestRun = await runDigestForBrowserTest(userId);
    digestNotificationId = digestRun.notificationId;

    console.log('9. Re-opening the origin and checking the service worker push cache...');
    page = await context.newPage();
    page.setDefaultTimeout(20000);
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });

    let pushPayload = null;
    for (let attempt = 0; attempt < 15; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop
      pushPayload = await page.evaluate(async () => {
        const cache = await caches.open('hulex-web-push-cache-v1');
        const response = await cache.match('/__hulex_last_push__');
        return response ? response.json() : null;
      });

      if (pushPayload) {
        break;
      }

      // eslint-disable-next-line no-await-in-loop
      await page.waitForTimeout(1000);
    }

    if (!pushPayload) {
      throw new Error('The service worker did not store a pushed payload');
    }

    const registrationNotifications = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      const notifications = await registration?.getNotifications();

      return (notifications || []).map((item) => ({
        title: item.title,
        body: item.body,
        tag: item.tag,
        icon: item.icon
      }));
    });

    console.log('10. Collecting notification result...');
    const result = {
      permission: await page.evaluate(() => Notification.permission),
      enabled: await page.evaluate(() =>
        window.localStorage.getItem('hulex-browser-notifications-enabled')
      ),
      mode: await page.evaluate(() =>
        window.localStorage.getItem('hulex-browser-notifications-mode')
      ),
      pushPayload,
      registrationNotifications
    };

    console.log(
      JSON.stringify(
        {
          success: true,
          simulatedSchedule: 'real digest service invocation with page closed and service worker web push enabled',
          permission: result.permission,
          enabled: result.enabled,
          mode: result.mode,
          pushPayload: result.pushPayload,
          registrationNotifications: result.registrationNotifications,
          observedApiRequests: Array.from(observedApiRequests).sort(),
          directBackendRequests: Array.from(directBackendRequests).sort()
        },
        null,
        2
      )
    );
  } finally {
    try {
      if (digestNotificationId) {
        await AlertNotification.deleteOne({ _id: digestNotificationId });
      }
    } catch {}

    try {
      if (userId) {
        await resetUserWebPushSubscriptions(userId);
      }
    } catch {}

    try {
      if (page) await page.close();
    } catch {}

    try {
      if (context) await context.close();
    } catch {}

    try {
      if (userDataDir) {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      }
    } catch {}

    try {
      await mongoose.disconnect();
    } catch {}
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
