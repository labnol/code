/**
 *
 *
 * This Google Script will delete everything in your Gmail account.
 * It removes email messages, filters, labels and reset all your settings
 *
 * Written by Amit Agarwal (amit@labnol.org)


         88
         88
         88
 ,adPPYb,88 ,adPPYYba, 8b,dPPYba,   ,adPPYb,d8  ,adPPYba, 8b,dPPYba,
a8"    `Y88 ""     `Y8 88P'   `"8a a8"    `Y88 a8P_____88 88P'   "Y8
8b       88 ,adPPPPP88 88       88 8b       88 8PP""""""" 88
"8a,   ,d88 88,    ,88 88       88 "8a,   ,d88 "8b,   ,aa 88
 `"8bbdP"Y8 `"8bbdP"Y8 88       88  `"YbbdP"Y8  `"Ybbd8"' 88
                                    aa,    ,88
                                     "Y8bbdP"


 * Proceed with great caution since the process is irreversible
 *
 * This software comes with ABSOLUTELY NO WARRANTY.
 * This is free software, and you are welcome to modify and redistribute it
 *
 * This permission notice shall be included in all copies of the Software.
 *
 *
 */

/**
 * Remove all labels in Gmail
 */
const deleteGmailLabels_ = () => {
  GmailApp.getUserLabels().forEach((label) => {
    label.deleteLabel();
  });
};

/**
 * Remove all Gmail Filters
 */
const deleteGmailFilters_ = () => {
  const { filter: gmailFilters } = Gmail.Users.Settings.Filters.list('me');
  gmailFilters.forEach(({ id }) => {
    Gmail.Users.Settings.Filters.remove('me', id);
  });
};

/**
 * Remove all Gmail Draft messages
 */
const deleteGmailDrafts_ = () => {
  GmailApp.getDrafts().forEach((draft) => {
    draft.deleteDraft();
  });
};

/**
 * Reset Gmail Settings
 */
const resetGmailSettings_ = () => {
  // Disable Out-of-office
  Gmail.Users.Settings.updateVacation({ enableAutoReply: false }, 'me');

  // Delete Gmail Signatures
  const { sendAs } = Gmail.Users.Settings.SendAs.list('me');
  sendAs.forEach(({ sendAsEmail }) => {
    Gmail.Users.Settings.SendAs.update({ signature: '' }, 'me', sendAsEmail);
  });

  // Disable IMAP
  Gmail.Users.Settings.updateImap({ enabled: false }, 'me');

  // Disable POP
  Gmail.Users.Settings.updatePop({ accessWindow: 'disabled' }, 'me');

  // Disable Auto Forwarding
  const { forwardingAddresses } = Gmail.Users.Settings.ForwardingAddresses.list('me');
  forwardingAddresses.forEach(({ forwardingEmail }) => {
    Gmail.Users.Settings.ForwardingAddresses.remove('me', forwardingEmail);
  });
};

const startTime = Date.now();
const isTimeLeft_ = () => {
  const ONE_SECOND = 1000;
  const MAX_EXECUTION_TIME = ONE_SECOND * 60 * 5;
  return MAX_EXECUTION_TIME > Date.now() - startTime;
};

/**
 * Move all Gmail threads to trash folder
 */
const deleteGmailThreads_ = () => {
  let threads = [];
  do {
    threads = GmailApp.search('in:all', 0, 100);
    if (threads.length > 0) {
      GmailApp.moveThreadsToTrash(threads);
      Utilities.sleep(1000);
    }
  } while (threads.length && isTimeLeft_());
};

/**
 * Move all Spam email messages to the Gmail Recyle bin
 */
const deleteSpamEmails_ = () => {
  let threads = [];
  do {
    threads = GmailApp.getSpamThreads(0, 10);
    if (threads.length > 0) {
      GmailApp.moveThreadsToTrash(threads);
      Utilities.sleep(1000);
    }
  } while (threads.length && isTimeLeft_());
};

/**
 * Permanetly empty the Trash folder
 */
const emptyGmailTrash_ = () => {
  let threads = [];
  do {
    threads = GmailApp.getTrashThreads(0, 100);
    threads.forEach((thread) => {
      Gmail.Users.Threads.remove('me', thread.getId());
    });
  } while (threads.length && isTimeLeft_());
};

/**
 * Factory Reset your Gmail Account
 * Replace NO with YES and run this function
 * */
const factoryResetGmail = () => {
  const FACTORY_RESET = 'NO';
  if (FACTORY_RESET === 'YES') {
    resetGmailSettings_();
    deleteGmailLabels_();
    deleteGmailFilters_();
    deleteGmailDrafts_();
    deleteGmailThreads_();
    deleteSpamEmails_();
    emptyGmailTrash_();
  }
};
