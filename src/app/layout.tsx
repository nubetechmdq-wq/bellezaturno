import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BellezaTurno - Reservas Online para Tu Salón",
    template: "%s | BellezaTurno",
  },
  description:
    "La plataforma líder para barberías, peluquerías y salones de belleza en Argentina. Creá tu landing page y gestioná tus turnos con WhatsApp.",
  keywords: ["barbería", "peluquería", "spa", "turnos online", "reservas", "Argentina"],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://bellezaturno.com",
    siteName: "BellezaTurno",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="es">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
