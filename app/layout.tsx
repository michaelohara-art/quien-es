import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from 'next/link';
import "./_library/styles/_stylesheet.scss";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "¿Quien Es?",
  description: "description",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable}`}>
        <div className='app-main'>
          <Link href="/sign-in">SIGN IN</Link>
          {children}
        </div>
      </body>
    </html>
  );
}
