import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Insta — Video Automation Platform',
  description: 'Automate YouTube video clipping and Instagram publishing',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-[#0a0a0f] text-white antialiased overflow-auto`}
        style={{
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'optimizeLegibility',
        }}
      >
        {/* Animated gradient orbs background */}
        <div className="gradient-bg" aria-hidden="true">
          <div className="gradient-orb gradient-orb-1" />
          <div className="gradient-orb gradient-orb-2" />
          <div className="gradient-orb gradient-orb-3" />
          <div className="gradient-orb gradient-orb-4" />
        </div>

        {/* Noise texture overlay for depth */}
        <div className="noise-overlay" aria-hidden="true" />

        {/* Page content */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}