import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "InterviewForge - Crack Technical Coding Interviews",
  description: "Personalized mock coding interviews, resume-based question generation, and 30-day study roadmaps.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'dark';
                if (theme === 'light') {
                  document.documentElement.classList.add('light-theme');
                } else {
                  document.documentElement.classList.remove('light-theme');
                }
              })()
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
