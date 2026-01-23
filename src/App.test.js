import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Audio Visualizer header', () => {
  render(<App />);
  const headerElement = screen.getByRole('heading', { name: /Audio Visualizer/i });
  expect(headerElement).toBeInTheDocument();
});
