/**
 * Create Zoom Meetings with Google Apps Script
 *
 * Author: Amit Agarwal
 * Email: amit@labnol.org
 *
 * MIT License
 */

const ZOOM_API_KEY = '<<your key here>>';
const ZOOM_API_SECRET = '<<your secret here>>';
const ZOOM_EMAIL = '<<your email here>>';

const getAccessToken_ = () => {
  const encode = (text) => Utilities.base64Encode(text).replace(/=+$/, '');

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = encode(JSON.stringify(header));
  const claimData = {
    iss: ZOOM_API_KEY,
    exp: Date.now() + 3600,
  };
  const encodedClaim = encode(JSON.stringify(claimData));
  const toSign = `${encodedHeader}.${encodedClaim}`;
  const signature = encode(Utilities.computeHmacSha256Signature(toSign, ZOOM_API_SECRET));
  return `${toSign}.${signature}`;
};

const getZoomUserId_ = () => {
  const request = UrlFetchApp.fetch('https://api.zoom.us/v2/users/', {
    method: 'GET',
    contentType: 'application/json',
    headers: { Authorization: `Bearer ${getAccessToken_()}` },
  });
  const { users } = JSON.parse(request.getContentText());
  const [{ id } = {}] = users.filter(({ email }) => email === ZOOM_EMAIL);
  return id;
};

const createZoomMeeting = () => {
  const meetingOptions = {
    topic: 'Zoom Meeting created with Google Script',
    type: 1,
    start_time: '2020-07-30T10:45:00',
    timezone: 'America/New_York',
    password: 'labnol',
    agenda: 'Discuss the product launch',
    settings: {
      auto_recording: 'none',
      mute_upon_entry: true,
    },
  };

  const request = UrlFetchApp.fetch(`https://api.zoom.us/v2/users/${getZoomUserId_()}/meetings`, {
    method: 'POST',
    contentType: 'application/json',
    headers: { Authorization: `Bearer ${getAccessToken_()}` },
    payload: JSON.stringify(meetingOptions),
  });
  const { join_url, id } = JSON.parse(request.getContentText());
  Logger.log(`Zoom meeting ${id} created`, join_url);
};
