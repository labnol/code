/**
 * Disposable Gmail Address
 * ========================
 *
 * Written by Amit Agarwal
 * Email: amit@labnol.org
 * Web: https://www.labnol.org
 * Twitter: @labnol
 *
 * Under MIT License
 */

const RECIPIENT = 'amit@labnol.org';

/**
 * Run a trigger every 15 minutes that checks for
 * new emails in the Gmail inbox folder
 */
const initialize = () => {
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('checkTemporaryInbox').timeBased().everyMinutes(5).create();
};

/** Check if an email message should be forward from the
 * temporary inbox to the main Gmail inbox based on the
 * date in the TO field of the incoming message
 */
const isAllowed_ = (email = '') => {
  const [, mm, dd, yyyy] = email.match(/\+(\d{2})(\d{2})(\d{4})?@/) || [];
  if (mm) {
    const now = new Date();
    const date = new Date([yyyy || now.getFullYear(), mm, dd].join('/'));
    date.setHours(23);
    date.setMinutes(59);
    return date > now;
  }
  return false;
};

/**
 * Fetch the 10 most recent threads from Gmail inbox,
 * parse the To field of each message and either forward it
 * or archive the emssage
 */
const checkTemporaryInbox = () => {
  GmailApp.getInboxThreads(0, 10).forEach((thread) => {
    thread.getMessages().forEach((message) => {
      if (isAllowed_(message.getTo())) {
        message.forward(RECIPIENT);
      }
    });
    thread.moveToArchive();
  });
};
