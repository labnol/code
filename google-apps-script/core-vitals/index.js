/**
 * Google Core Web Vitals
 * ========================
 *
 * Written by Amit Agarwal
 * Email: amit@labnol.org
 * Web: https://www.labnol.org
 * Twitter: @labnol
 *
 * Under MIT License
 */

const getUrls = () => {
  const data = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('URLs')
    .getDataRange()
    .getDisplayValues()
    .map(([url, name]) => ({ url, name }))
    .filter(({ url }) => /^http/i.test(url));
  return data;
};

const parseResponse = (metrics, audits, strategy) => {
  const getPercentile = (key) => {
    return metrics[key].percentile;
  };

  const getValue = (key) => {
    return audits[key].numericValue.toFixed(1);
  };

  const key = (text) => `${text} (${strategy})`;

  return {
    [key('First Contentful Paint')]: getPercentile('FIRST_CONTENTFUL_PAINT_MS'),
    [key('First Input Delay')]: getPercentile('FIRST_INPUT_DELAY_MS'),
    [key('Largest Contentful Paint')]: getPercentile('LARGEST_CONTENTFUL_PAINT_MS'),
    [key('Cumulative Layout Shift')]: getPercentile('CUMULATIVE_LAYOUT_SHIFT_SCORE'),
    [key('Speed Index')]: getValue('speed-index'),
    [key('Time to Interactive')]: getValue('interactive'),
    [key('Estimated Input Latency')]: getValue('estimated-input-latency'),
  };
};

const fetchPage = (url, strategy) => {
  try {
    const params = {
      url,
      strategy,
      category: 'performance',
      fields: 'loadingExperience,lighthouseResult(audits)',
      key: '<<YOUR API KEY HERE>>',
    };
    const qs = Object.keys(params)
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${qs}`;
    let response = null;
    try {
      response = UrlFetchApp.fetch(apiUrl, {
        muteHttpExceptions: false,
      });
    } catch (f) {
      Utilities.sleep(5000);
      response = UrlFetchApp.fetch(apiUrl, {
        muteHttpExceptions: true,
      });
    }
    const { error, loadingExperience: { metrics = null } = {}, lighthouseResult: { audits = null } = {} } = JSON.parse(
      response.getContentText()
    );
    if (!error) return parseResponse(metrics, audits, strategy);
  } catch (f) {
    // do nothing
  }
  return null;
};

const writeDataToSheet = (name, data) => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name) || ss.insertSheet(name, 1, { template: ss.getSheetByName('template') });
  const vitals = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, 1)
    .getValues()
    .map(([e]) => {
      return [data[e]];
    });
  sheet.getRange(1, sheet.getLastColumn() + 1, vitals.length + 1, 1).setValues([[new Date()], ...vitals]);
};

const measureCoreVitals = () => {
  const urls = getUrls();
  for (let u = 0; u < urls.length; u += 1) {
    const { name, url } = urls[u];
    const data = { ...fetchPage(url, 'desktop'), ...fetchPage(url, 'mobile') };
    if (data !== null) {
      writeDataToSheet(name, data);
    }
  }
  SpreadsheetApp.flush();
};

const init = () => {
  ScriptApp.getProjectTriggers().forEach((trigger) => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('measureCoreVitals').timeBased().everyDays(1).create();
  SpreadsheetApp.getActiveSpreadsheet().toast('Success!');
};
