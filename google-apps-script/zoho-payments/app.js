/*

This Google Script will let you accept payments
on your website using Zoho Payments

Tutorial: www.labnol.org//zoho-payments-241005

Author: Amit Agarwal https://digitalinspiration.com/

*/

const ZOHO_PAYMENTS_CLIENT_ID = '';
const ZOHO_PAYMENTS_CLIENT_SECRET = '';
const ZOHO_PAYMENTS_ACCOUNT_ID = '';
const ZOHO_ACCOUNT_API_KEY = '';

const ZOHO_MERCHANT_NAME = 'Digital Inspiration';
const ZOHO_SERVICE_NAME = 'Zoho Payments';

const doGet = () => {
  const html = HtmlService.createHtmlOutputFromFile('store');
  html.setTitle('Zoho Payments - Demo Store');
  return html;
};

const getZohoPaymentsService_ = () => {
  return OAuth2.createService(ZOHO_SERVICE_NAME)
    .setAuthorizationBaseUrl('https://accounts.zoho.in/oauth/v2/auth')
    .setTokenUrl('https://accounts.zoho.in/oauth/v2/token')
    .setClientId(ZOHO_PAYMENTS_CLIENT_ID)
    .setClientSecret(ZOHO_PAYMENTS_CLIENT_SECRET)
    .setCallbackFunction('zohoOauthCallback')
    .setPropertyStore(PropertiesService.getScriptProperties())
    .setCache(CacheService.getScriptCache())
    .setParam('response_type', 'code')
    .setScope('ZohoPay.payments.CREATE')
    .setParam('access_type', 'offline')
    .setParam('prompt', 'consent');
};

const zohoOauthCallback = (request) => {
  const service = getZohoPaymentsService_();
  const isAuthorized = service.handleCallback(request);
  const message = isAuthorized ? `Connected to ${ZOHO_SERVICE_NAME}` : `Connection failed :(`;
  return HtmlService.createHtmlOutput(message);
};

const createZohoPaymentSession = (amount) => {
  const service = getZohoPaymentsService_();
  const apiUrl = `https://payments.zoho.in/api/v1/paymentsessions?account_id=${ZOHO_PAYMENTS_ACCOUNT_ID}`;
  const response = UrlFetchApp.fetch(apiUrl, {
    method: 'post',
    payload: JSON.stringify({ amount, currency: 'INR' }),
    headers: {
      Authorization: `Zoho-oauthtoken ${service.getAccessToken()}`,
      'Content-Type': 'application/json',
    },
    muteHttpExceptions: true,
  });
  const { message, payments_session } = JSON.parse(response.getContentText());
  return message === 'success'
    ? {
        account_id: ZOHO_PAYMENTS_ACCOUNT_ID,
        api_key: ZOHO_ACCOUNT_API_KEY,
        merchant_name: ZOHO_MERCHANT_NAME,
        session_id: payments_session.payments_session_id,
        order_amount: payments_session.amount,
      }
    : { error: message };
};

const printZohoPaymentsRedirectUrl = () => {
  const redirectUrl = OAuth2.getRedirectUri();
  Logger.log(redirectUrl);
};

const printZohoPaymentsAuthUrl = () => {
  const service = getZohoPaymentsService_();
  const authUrl = service.getAuthorizationUrl();
  Logger.log(authUrl);
};
