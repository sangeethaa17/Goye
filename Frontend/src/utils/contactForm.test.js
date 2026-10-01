import { validateContactForm, buildContactMessage } from './contactForm';

describe('contact form helpers', () => {
  it('rejects incomplete or invalid contact submissions', () => {
    const result = validateContactForm({
      name: '   ',
      email: 'not-an-email',
      subject: '',
      message: ''
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      'Please enter your full name.',
      'Please enter a valid email address.',
      'Please enter a subject.',
      'Please enter your message.'
    ]));
  });

  it('builds a clear WhatsApp message from valid form data', () => {
    const text = buildContactMessage({
      name: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'Pricing',
      message: 'I would like a demo.'
    });

    expect(text).toContain('New contact form submission');
    expect(text).toContain('Jane Doe');
    expect(text).toContain('jane@example.com');
    expect(text).toContain('Pricing');
    expect(text).toContain('I would like a demo.');
  });
});
