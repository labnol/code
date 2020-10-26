/**
 *  Watch Google Drive Files
 *  Author: amit@labnol.org
 *  Web: https://digitalinspiration.com/
 *  MIT License
 * */

// Enter the email address for email notification
const EMAIL = "amit@labnol.org";

// How frequently should the watcher run? Put 2 for running every 2 days.
const RUNNING_FREQUENCY = 1;

// At what hour of the day should the script run?
const RUN_AT_HOUR = 10;

const enableDriveWatch = () => {
  const triggerName = "watchGoogleDrive";
  const [trigger = null] = ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === triggerName);
  if (trigger === null) {
    ScriptApp.newTrigger(triggerName).timeBased().everyDays(1).atHour(RUN_AT_HOUR).create();
  }
};

const disableDriveWatch = () => {
  ScriptApp.getProjectTriggers().map((trigger) => {
    ScriptApp.deleteTrigger(trigger);
  });
};

const checkChangedFiles_ = (items) => {
  const cacheStore = CacheService.getScriptCache();
  const processed = (cacheStore.get("cache") || "").split(",");
  cacheStore.put("cache", items.map(({ id }) => id).join(","), 21600);
  return items
    .map(({ file }) => file)
    .filter(({ id, alternateLink, title }) => id && alternateLink && title)
    .filter(({ ownedByMe }) => ownedByMe)
    .filter(({ id }) => processed.indexOf(id) === -1)
    .filter(({ labels: { trashed = null } = {} }) => trashed === true)
    .map((file) => {
      const {
        iconLink = "",
        alternateLink = "",
        title = "",
        lastModifyingUser = {},
        createdDate = "",
        fileSize = "",
      } = file;

      const { emailAddress = "", displayName = "", picture: { url = "" } = {} } = lastModifyingUser;
      const fileDate = createdDate ? Utilities.formatDate(new Date(createdDate), "IST", "MMMMM dd, YYYY") : "";

      return [
        iconLink ? `<img src="${iconLink}" height=16 />` : "",
        `<a href="${alternateLink}">${title}</a>`,
        fileSize ? `(${Math.round(fileSize / 1000)} Kb)` : "",
        fileDate ? `Created: ${fileDate}` : "",
        `${displayName || emailAddress}`,
        url ? `<img src="${url}" height=16 />` : "",
      ];
    });
};

const sendEmail_ = (rows = []) => {
  const { length } = rows;
  if (length === 0) return;

  const html = [
    `<table border="0" cellpadding="8" cellspacing="4" style="font-size:12px">`,
    rows
      .map((row) => row.map((td) => `<td>${td}</td>`).join(""))
      .map((tr) => `<tr>${tr}</tr>`)
      .join(""),
    `</table>`,
    `<p style="background:#ffffe0; padding:12px;font-size:12px;display:inline-block">`,
    `<a href="https://www.labnol.org/google-drive-monitor-201026">Drive Watch</a> is developed by`,
    ` <a href="https://digitalinspiration.com/">Digital Inspiration</a></p>`,
  ];
  MailApp.sendEmail({
    to: EMAIL,
    name: "Drive Watch",
    subject: `[Drive Watch] ${rows.length} files were deleted in your Google Drive`,
    htmlBody: html.join(""),
  });
};

const watchGoogleDrive = () => {
  const propertyStore = PropertiesService.getScriptProperties();

  const pageToken =
    propertyStore.getProperty("token") || Drive.Changes.getStartPageToken({ supportsAllDrives: true }).startPageToken;

  const fields =
    "newStartPageToken,items(file(id,title,labels(trashed),iconLink,mimeType,createdDate,ownedByMe,lastModifyingUser(emailAddress,displayName,picture(url)),alternateLink, fileSize))";

  const { newStartPageToken, items = [] } = Drive.Changes.list({
    fields,
    pageToken,
    includeItemsFromAllDrives: true,
    pageSize: 100,
    supportsAllDrives: true,
  });

  if (newStartPageToken) {
    propertyStore.setProperty("token", newStartPageToken);
  }

  if (items.length) {
    const deletedItems = checkChangedFiles_(items);
    sendEmail_(deletedItems);
  }
};
