import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XcelLearn",
  description: "Learning management platform by XEStudioz",
  applicationName: "XcelLearn",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}