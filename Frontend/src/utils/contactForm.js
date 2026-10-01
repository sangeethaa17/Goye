const WHATSAPP_NUMBER = process.env.REACT_APP_CONTACT_WHATSAPP_NUMBER || '919486042369';

export function normalizeWhatsappNumber(number) {
  const digits = String(number || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('91') ? digits : `91${digits}`;
}

export function validateContactForm(values) {
  const errors = [];
  const name = String(values?.name || '').trim();
  const email = String(values?.email || '').trim();
  const subject = String(values?.subject || '').trim();
  const message = String(values?.message || '').trim();

  if (!name) errors.push('Please enter your full name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please enter a valid email address.');
  if (!subject) errors.push('Please enter a subject.');
  if (!message) errors.push('Please enter your message.');

  return { isValid: errors.length === 0, errors };
}

export function buildContactMessage(values) {
  const name = String(values?.name || '').trim();
  const email = String(values?.email || '').trim();
  const subject = String(values?.subject || '').trim();
  const message = String(values?.message || '').trim();

  return [
    'New contact form submission',
    `Name: ${name}`,
    `Email: ${email}`,
    `Subject: ${subject}`,
    `Message: ${message}`
  ].join('\n');
}

export function getContactWhatsappNumber() {
  return normalizeWhatsappNumber(WHATSAPP_NUMBER);
}
