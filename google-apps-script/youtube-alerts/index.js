/*

This Google Script will find matching videos on Youtube
and send them in an email digest

Tutorial: www.labnol.org/youtube-email-alerts-201219

Author: Amit Agarwal https://digitalinspiration.com/

*/

const CONFIG = {
  emailAddress: 'amit@labnol.org',
  searchQueries: ['tesla model y', "the queen's gambit", 'minecraft tutorial'],
  negativeWords: ['sponsored', 'money'],
  geographicRegion: 'US',
  preferredVideoLanguage: 'en',
  maxVideosPerQuery: 10,
  emailAlertHour: 11,
  emailAlertTimezone: 'GMT',
};

const getLastRunDate_ = () => {
  const dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'";
  const formatDate = (date) => Utilities.formatDate(date, 'UTC', dateFormat);
  const service = PropertiesService.getUserProperties();
  const lastRun = service.getProperty('LAST_RUN_DATE') || '';
  service.setProperty('LAST_RUN_DATE', String(Date.now()));
  if (lastRun) return formatDate(new Date(parseInt(lastRun, 10)));
  const date = new Date();
  date.setDate(date.getDate() - 3);
  return formatDate(date);
};

const fetchYouTubeVideos_ = (query, lastRunDate) => {
  const data = YouTube.Search.list(['snippet'], {
    maxResults: CONFIG.maxVideosPerQuery,
    regionCode: CONFIG.geographicRegion,
    publishedAfter: lastRunDate,
    relevanceLanguage: CONFIG.preferredVideoLanguage,
    q: query,
    type: ['video'],
    fields: 'items(id(videoId),snippet(title, channelTitle, channelId))',
  });
  return data.items
    .map((item) => {
      const { id: { videoId } = {}, snippet: { title, channelTitle, channelId } = {} } = item;
      return { videoId, title, channelTitle, channelId };
    })
    .filter(({ channelTitle, title }) => {
      const input = [channelTitle, title].join(' ').toLowerCase();
      return CONFIG.negativeWords.filter((word) => input.indexOf(word.toLowerCase()) !== -1).length === 0;
    });
};

const triggerYouTubeAlerts = () => {
  const lastRunDate = getLastRunDate_();
  const videos = CONFIG.searchQueries
    .map((query) => fetchYouTubeVideos_(query, lastRunDate))
    .reduce((arr, input) => {
      return arr.concat(input);
    }, []);
  if (videos.length) {
    const template = HtmlService.createTemplateFromFile('index');
    template.videos = videos;
    MailApp.sendEmail(CONFIG.emailAddress, `[YouTube Alerts] ${videos.length} videos found`, '', {
      name: 'YouTube Email Alerts',
      htmlBody: template.evaluate().getContent(),
    });
  }
};

const initialize = () => {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i += 1) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  ScriptApp.newTrigger(triggerYouTubeAlerts.name)
    .timeBased()
    .everyDays(1)
    .atHour(parseInt(CONFIG.emailAlertHour, 10))
    .inTimezone(CONFIG.emailAlertTimezone)
    .create();
  triggerYouTubeAlerts();
};
