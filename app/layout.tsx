import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import GenderPrompt from "./components/GenderPrompt";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MSA Volunteer Portal",
  description: "Volunteer coordination portal for the Muslim Students' Association at the University of Alberta",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
          <GenderPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}