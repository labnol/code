/**
 *  Gmail Spam AI Classifier
 *  Author: amit@labnol.org
 *  Web: https://digitalinspiration.com/
 *  MIT License
 * */

// Google Script to analyze spam emails in Gmail using OpenAI and
// send a report of false positives that could be legitimate emails.

// Basic configuration
const USER_EMAIL = 'amit@labnol.org'; // Email address to send the report to
const OPENAI_API_KEY = 'sk-proj-123'; // API key for OpenAI
const OPENAI_MODEL = 'gpt-4o'; // Model name to use with OpenAI
const USER_LANGUAGE = 'English'; // Language for the email summary

// Advanced configuration
const HOURS_AGO = 24; // Time frame to search for emails (in hours)
const MAX_THREADS = 25; // Maximum number of email threads to process
const MAX_BODY_LENGTH = 200; // Maximum length of email body to include in the AI prompt
const SPAM_THRESHOLD = 2; // Threshold for spam score to include in the report

const SYSTEM_PROMPT = `You are an AI email classifier. Given the content of an email, analyze it and assign a spam score on a scale from 0 to 10, where 0 indicates a legitimate email and 10 indicates a definite spam email. Provide a short summary of the email in ${USER_LANGUAGE}. Your response should be in JSON format.`;
let tokens = 0; // Variable to track the number of tokens used in the AI API calls

// Find unread emails in Gmail spam folder
const getSpamThreads_ = () => {
  const epoch = (date) => Math.floor(date.getTime() / 1000);
  const beforeDate = new Date();
  const afterDate = new Date();
  afterDate.setHours(afterDate.getHours() - HOURS_AGO);
  const searchQuery = `is:unread in:spam after:${epoch(afterDate)} before:${epoch(beforeDate)}`;
  return GmailApp.search(searchQuery, 0, MAX_THREADS);
};

// Create a prompt for the OpenAI model using the email message
const getMessagePrompt_ = (message) => {
  // remove all URLs, and whitespace characters
  const body = message
    .getPlainBody()
    .replace(/https?:\/\/[^\s>]+/g, '')
    .replace(/[\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return [
    `Subject: ${message.getSubject()}`,
    `Sender: ${message.getFrom()}`,
    `Body: ${body.substring(0, MAX_BODY_LENGTH)}`, // Email body (truncated)
  ].join('\n');
};

// Function to get the spam score and summary from OpenAI
const getMessageScore_ = (messagePrompt) => {
  const apiUrl = `https://api.openai.com/v1/chat/completions`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${OPENAI_API_KEY}`,
  };
  const response = UrlFetchApp.fetch(apiUrl, {
    method: 'POST',
    headers,
    payload: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: messagePrompt },
      ],
      temperature: 0.2,
      max_tokens: 124,
      response_format: { type: 'json_object' },
    }),
  });
  const data = JSON.parse(response.getContentText());
  tokens += data.usage.total_tokens;
  const content = JSON.parse(data.choices[0].message.content);
  return content;
};

// Generate a link to the email message in Gmail
const getMessageLink_ = (message) => {
  const from = message.getFrom() || '';
  const matches = from.match(/<([^>]+)>/);
  const senderEmail = matches ? matches[1] : from;
  const messageLink = Utilities.formatString(
    'https://mail.google.com/mail/u/0/#search/%s',
    encodeURIComponent(`from:${senderEmail} in:spam`)
  );
  return `<a href=${messageLink}>${senderEmail}</a>`;
};

// Send a report of false positives to the user's email
const reportFalsePositives = () => {
  const html = [];
  const threads = getSpamThreads_();
  for (let i = 0; i < threads.length; i += 1) {
    const [message] = threads[i].getMessages(); // Get the first message in each thread
    const messagePrompt = getMessagePrompt_(message); // Create the message prompt
    const { spam_score, summary } = getMessageScore_(messagePrompt); // Get the spam score and summary from OpenAI
    if (spam_score <= SPAM_THRESHOLD) {
      // Add email message to the report if the spam score is below the threshold
      html.push(`<tr><td>${getMessageLink_(message)}</td> <td>${summary}</td></tr>`);
    }
  }
  threads.forEach((thread) => thread.markRead()); // Mark all processed emails as read
  if (html.length > 0) {
    const htmlBody = [
      `<table border="1" cellpadding="10"
      style="max-width: 720px; border: 1px solid #ddd; margin-top: 16px; border-collapse: collapse;">`,
      '<tr><th>Email Sender</th><th>Summary</th></tr>',
      html.join(''),
      '</table>',
    ].join('');
    const subject = `Gmail Spam Report - ${tokens} tokens used`;
    GmailApp.sendEmail(USER_EMAIL, subject, '', { htmlBody });
  }
};
