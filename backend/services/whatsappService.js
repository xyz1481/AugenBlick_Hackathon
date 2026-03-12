const Twilio = require('twilio');

const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

function normalizeWhatsappNumber(phone) {
  // Ensure it is in E.164 format (e.g. +15551234567)
  // You can enhance this with a real parser if needed.
  return phone.trim();
}

async function sendWhatsappMessage(toPhone, body) {
  if (!process.env.TWILIO_WHATSAPP_FROM) {
    throw new Error('TWILIO_WHATSAPP_FROM not configured');
  }

  const to = `whatsapp:${normalizeWhatsappNumber(toPhone)}`;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  return client.messages.create({
    from,
    to,
    body,
  });
}

module.exports = { sendWhatsappMessage };