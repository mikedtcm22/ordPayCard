import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { Header } from '../layout/Header';

const HeaderWithRouter = () => (
  <BrowserRouter>
    <Header />
  </BrowserRouter>
);

describe('Header Component', () => {
  it('renders the SatSpray title', () => {
    render(<HeaderWithRouter />);
    expect(screen.getByText('SatSpray')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<HeaderWithRouter />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Top Up')).toBeInTheDocument();
    expect(screen.getByText('Manual Flows')).toBeInTheDocument();
  });

  it('has correct navigation structure', () => {
    render(<HeaderWithRouter />);
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });
});
