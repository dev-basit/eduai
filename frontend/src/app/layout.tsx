import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import StartupModal from '@/components/StartupModal';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EduAI — AI Learning Platform',
  description: 'Personalized AI-powered education tools',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full" style={{ background: '#f1f2f6' }}>
        <StartupModal />
        {children}
      </body>
    </html>
  );
}
