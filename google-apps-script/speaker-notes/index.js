/**
 * Extract Speaker Notes from Google Slides
 */

const speakerNotes = () => {
  const notes = SlidesApp.getActivePresentation()
    .getSlides()
    .map((slide) => {
      return slide.getNotesPage().getSpeakerNotesShape().getText().asString();
    })
    .join('\n');

  // Create a file in Google Drive for storing notes
  const file = DriveApp.createFile('Speaker Notes', notes);

  // Print the file download URL in the Logger window
  Logger.log(file.getDownloadUrl());
};
