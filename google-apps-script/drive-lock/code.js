/**
 *  Make Google Drive files Read only
 *  Author: amit@labnol.org
 *  Web: https://digitalinspiration.com/
 *  MIT License
 * */

const makeFileReadyOnly = () => {
  const fileUrl = 'https://docs.google.com/document/d/.....';
  const [fileId] = fileUrl.split('/').filter((e) => /[_-\w]{25,}/.test(e));
  UrlFetchApp.fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, {
    method: 'PATCH',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${ScriptApp.getOAuthToken()}`,
    },
    payload: JSON.stringify({
      contentRestrictions: [
        {
          readOnly: true,
          reason: 'Prevent accidental editing',
        },
      ],
    }),
  });
};
