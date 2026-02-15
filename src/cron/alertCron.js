const cron = require('node-cron');
const { runAlertsCheck } = require('../services/alertsService');

let task;

function startAlertCron() {
  const schedule = process.env.ALERT_CRON || '0 9,13,20 * * *';
  const timezone = process.env.ALERT_CRON_TZ || 'UTC';

  task = cron.schedule(
    schedule,
    async () => {
      try {
        console.log('Running scheduled alert checks...');
        await runAlertsCheck();
      } catch (err) {
        console.error('Scheduled alert checks failed:', err.message);
      }
    },
    { timezone }
  );

  console.log(`Alert cron scheduled: ${schedule} (${timezone})`);
}

function stopAlertCron() {
  if (task) {
    task.stop();
  }
}

module.exports = { startAlertCron, stopAlertCron };
