import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "PrescriptoAI | A Smart AI Assistant for Your Prescriptions",
  description: "PrescriptoAI is a smart AI assistant for your prescriptions. It helps you manage your prescriptions and get the best out of your medications.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
