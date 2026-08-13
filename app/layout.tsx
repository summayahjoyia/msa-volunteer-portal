import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import ComplaintBox from "./components/ComplaintBox";

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
          <ComplaintBox />
        </AuthProvider>
      </body>
    </html>
  );
}