/**
 * Rename Files in Google Drive using Gemini AI
 *
 * Author: Amit Agarwal
 * Email: amit@labnol.org
 * Web: https://digitalinspiration.com/
 *
 * MIT License
 */

const GoogleDriveFolderId = 'Your Drive Folder Id';
const GoogleGeminiAPIKey = 'Your Gemini AI key';

const getFilesInFolder_ = (folderId) => {
  const mimeTypes = ['image/png', 'image/jpeg', 'image/webp'];
  const { files = [] } = Drive.Files.list({
    q: `'${folderId}' in parents and (${mimeTypes.map((type) => `mimeType='${type}'`).join(' or ')})`,
    fields: 'files(id,thumbnailLink,mimeType)',
    pageSize: 10,
  });
  return files;
};

const getFileAsBase64_ = (thumbnailLink) => {
  const blob = UrlFetchApp.fetch(thumbnailLink).getBlob();
  const base64 = Utilities.base64Encode(blob.getBytes());
  return base64;
};

const getSuggestedFilename_ = (base64, mimeType) => {
  const text = `Analyze the image content and propose a concise, descriptive filename in 5-15 words without providing any explanation or additional text. Use spaces instead of underscores. Append the extension based on file's mimeType which is ${mimeType}`;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${GoogleGeminiAPIKey}`;
  const inlineData = {
    mimeType,
    data: base64,
  };

  try {
    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify({
        contents: [{ parts: [{ inlineData }, { text }] }],
      }),
    });
    const data = JSON.parse(response);
    return data.candidates[0].content.parts[0].text.trim();
  } catch (f) {
    return null;
  }
};

const renameFilesInGoogleDrive = () => {
  const files = getFilesInFolder_(GoogleDriveFolderId);
  files.forEach((file) => {
    const { id, thumbnailLink, mimeType } = file;
    const base64 = getFileAsBase64_(thumbnailLink);
    const name = getSuggestedFilename_(base64, mimeType);
    if (name) {
      Drive.Files.update({ name }, id);
    }
  });
};
