import { render, screen } from '@testing-library/react';
import App from './App';

test('renders navigation hint', () => {
  render(<App />);
  expect(screen.getByText(/tap sides or swipe to navigate/i)).toBeInTheDocument();
});
