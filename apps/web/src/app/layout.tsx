import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'PayVerify — AI Payment Verification System',
  description:
    'Automated bank transaction verification system powered by Gmail and AI. Manage, search, and verify UTR payments in real time.',
  keywords: ['payment verification', 'UTR', 'bank transaction', 'Gmail', 'fintech'],
  authors: [{ name: 'PayVerify' }],
  robots: 'noindex, nofollow', // Internal admin tool
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-surface-900 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
