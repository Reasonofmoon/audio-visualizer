import React from 'react';
import { render, screen } from '@testing-library/react';
import AudioWaveformVisualization from './AudioWaveformVisualization';

// Global mocks are now in src/setupTests.js

test('renders AudioWaveformVisualization component', () => {
  render(<AudioWaveformVisualization />);
  // Check for elements from the fallback UI
  expect(screen.getByText(/Audio Visualization Not Available/i)).toBeInTheDocument();
  expect(screen.getByText(/Unfortunately, your browser or current environment does not fully support the Web Audio API needed for this visualizer./i)).toBeInTheDocument();
  
  // Assert that elements from the main UI are NOT present
  expect(screen.queryByText(/Audio Visualizer/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Choose audio file/i)).not.toBeInTheDocument();
});
