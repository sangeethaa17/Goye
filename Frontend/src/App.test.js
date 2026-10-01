import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the home page without crashing', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /Reach Thousands Instantly/i })).toBeInTheDocument();
  expect(screen.getByText(/Connect your WhatsApp/i)).toBeInTheDocument();
});
