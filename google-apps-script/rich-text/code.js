/**
 * Rich Text to Email
 * ========================
 *
 * Written by Amit Agarwal
 * Email: amit@labnol.org
 * Web: https://www.labnol.org
 * Twitter: @labnol
 *
 * Under MIT License
 */

const sendRichEmail = () => {
  const cellAddress = 'A1';
  const sheetName = 'Mail Merge';
  const recipient = 'amit@labnol.org';

  const richTextValue = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(sheetName)
    .getRange(cellAddress)
    .getRichTextValue();

  /* Run is a stylized text string used to represent cell text.
     This function transforms the run into HTML with CSS
   */
  const getRunAsHtml = (richTextRun) => {
    const richText = richTextRun.getText();

    // Returns the rendered style of text in a cell.
    const style = richTextRun.getTextStyle();

    // Returns the link URL, or null if there is no link
    // or if there are multiple different links.
    const url = richTextRun.getLinkUrl();

    const styles = {
      color: style.getForegroundColor(),
      'font-family': style.getFontFamily(),
      'font-size': `${style.getFontSize()}pt`,
      'font-weight': style.isBold() ? 'bold' : '',
      'font-style': style.isItalic() ? 'italic' : '',
      'text-decoration': style.isUnderline() ? 'underline' : '',
    };

    // Gets whether or not the cell has strikethrough.
    if (style.isStrikethrough()) {
      styles['text-decoration'] = `${styles['text-decoration']} line-through`;
    }

    const css = Object.keys(styles)
      .filter((attr) => styles[attr])
      .map((attr) => [attr, styles[attr]].join(':'))
      .join(';');

    const styledText = `<span style='${css}'>${richText}</span>`;
    return url ? `<a href='${url}'>${styledText}</a>` : styledText;
  };

  /* Returns the Rich Text string split into an array of runs,
  wherein each run is the longest possible
  substring having a consistent text style. */
  const runs = richTextValue.getRuns();
  const htmlBody = runs.map((run) => getRunAsHtml(run)).join('');

  MailApp.sendEmail(recipient, 'Rich HTML Email', '', { htmlBody });
};
