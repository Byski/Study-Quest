import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Study Quest - Your Academic Adventure',
  description: 'Transform your studies into an epic quest. Manage courses, track assignments, and level up your academic journey.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

