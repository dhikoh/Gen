import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import ToastProvider from "@/components/ToastProvider";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Prompt Gen",
  description: "Prompt Generator SaaS",
  manifest: "/manifest.json",
};

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import NextAuthProvider from "@/components/providers/NextAuthProvider";
import FloatingCsWidget from "@/components/cs/FloatingCsWidget";

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();
  const session = await getServerSession(authOptions);

  return (
    <html
      lang={locale}
      className={`${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ fontFamily: 'var(--font-poppins, Poppins), sans-serif' }}>
        <NextIntlClientProvider messages={messages}>
          <NextAuthProvider>
            <ToastProvider />
            {children}
            <FloatingCsWidget />
          </NextAuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
