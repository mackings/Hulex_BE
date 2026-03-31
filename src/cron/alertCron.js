const cron = require('node-cron');
const { runAlertsCheck } = require('../services/alertsService');
const { runHourlyRatesDigest } = require('../services/hourlyRatesNotificationService');

let alertTask;
let hourlyDigestTask;

function startAlertCron() {
  const alertSchedule = process.env.ALERT_CRON || '0 9,13,20 * * *';
  const alertTimezone = process.env.ALERT_CRON_TZ || 'UTC';
  const hourlySchedule = process.env.HOURLY_RATES_CRON || '0 * * * *';
  const hourlyTimezone = process.env.HOURLY_RATES_CRON_TZ || alertTimezone;

  alertTask = cron.schedule(
    alertSchedule,
    async () => {
      try {
        console.log('Running scheduled alert checks...');
        await runAlertsCheck();
      } catch (err) {
        console.error('Scheduled alert checks failed:', err.message);
      }
    },
    { timezone: alertTimezone }
  );

  hourlyDigestTask = cron.schedule(
    hourlySchedule,
    async () => {
      try {
        console.log('Running hourly rate digest notifications...');
        const result = await runHourlyRatesDigest();
        console.log(
          `Hourly digest complete. sentUsers=${result.sentUsers} failedUsers=${result.failedUsers} skipped=${result.skipped}`
        );
      } catch (err) {
        console.error('Hourly rate digest failed:', err.message);
      }
    },
    { timezone: hourlyTimezone }
  );

  console.log(`Alert cron scheduled: ${alertSchedule} (${alertTimezone})`);
  console.log(`Hourly rates cron scheduled: ${hourlySchedule} (${hourlyTimezone})`);
}

function stopAlertCron() {
  if (alertTask) alertTask.stop();
  if (hourlyDigestTask) hourlyDigestTask.stop();
}

module.exports = { startAlertCron, stopAlertCron };
