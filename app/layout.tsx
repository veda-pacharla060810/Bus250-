import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bus 250',
  description: "Some journeys don't need a destination.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
