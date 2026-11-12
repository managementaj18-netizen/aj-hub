// A&J – OTA bookings → ជំនួយការ (Telegram bot)
// Checks Gmail every 5 minutes for new Agoda / Booking.com / Expedia / Trip.com … booking emails
// and sends them to the A&J Guest App bot, which alerts the owner and remembers them.
// Run "setup" once: Google asks for Gmail permission, then the bot asks the owner in Telegram to tap ✅.

const OTA_URL = 'https://aj-guest-app.management-aj-18.workers.dev/api/ota';
const OTA_QUERY = 'newer_than:3d -in:sent (from:agoda.com OR from:booking.com OR from:expedia.com OR from:expediapartnercentral.com OR from:trip.com OR from:ctrip.com OR from:airbnb.com OR from:hostelworld.com OR from:traveloka.com)';
const WANT = /(booking id|new booking|reservation|cancel|modif|changed|confirmed|booking confirmation|itinerary|no-?show)/i;
const SKIP = /(insight|survey|promotion|competitor|rate match|review|newsletter|campaign|improve|tips|special request|new message|boost|invoice|statement|payout|webinar|affiliates)/i;

function token_() {
  const props = PropertiesService.getScriptProperties();
  let t = props.getProperty('token');
  if (!t) { t = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''); props.setProperty('token', t); }
  return t;
}

function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('checkOta').timeBased().everyMinutes(5).create();
  const r = UrlFetchApp.fetch(OTA_URL, { method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: JSON.stringify({ token: token_(), register: true, account: Session.getActiveUser().getEmail(), items: [] }) });
  console.log('connect: ' + r.getResponseCode() + ' ' + r.getContentText());
  console.log('សូមបើក Telegram ហើយចុច ✅ យល់ព្រម ក្នុងសាររបស់ជំនួយការ។');
}

function checkOta() {
  const props = PropertiesService.getScriptProperties();
  const seen = JSON.parse(props.getProperty('seen') || '[]');
  const items = [];
  GmailApp.search(OTA_QUERY, 0, 40).forEach(function (th) {
    th.getMessages().forEach(function (m) {
      const id = m.getId(), subj = m.getSubject() || '';
      if (seen.indexOf(id) >= 0) return;
      if (!WANT.test(subj) || SKIP.test(subj) || /mktg\.|transactional\.|newsletter\.|messaging/i.test(m.getFrom())) { seen.push(id); return; }
      if (Date.now() - m.getDate().getTime() > 3 * 86400000) { seen.push(id); return; }
      items.push({ id: id, from: m.getFrom(), subject: subj, date: m.getDate().toISOString(), body: m.getPlainBody().slice(0, 12000) });
    });
  });
  for (let i = 0; i < items.length; i += 5) {
    const part = items.slice(i, i + 5);
    const r = UrlFetchApp.fetch(OTA_URL, { method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: JSON.stringify({ token: token_(), items: part }) });
    if (r.getResponseCode() === 200) (JSON.parse(r.getContentText()).done || []).forEach(function (x) { seen.push(x); });
    else { console.log('send failed ' + r.getResponseCode() + ' ' + r.getContentText().slice(0, 200)); break; }
  }
  props.setProperty('seen', JSON.stringify(seen.slice(-400)));
}
