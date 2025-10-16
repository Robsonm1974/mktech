import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MKTECH - Tecnologia Gamificada para Educação",
  description: "Aulas de tecnologia gamificadas para EF1/EF2. Pensamento computacional, programação, lógica e inglês aplicado.",
  keywords: "educação, tecnologia, gamificação, programação, EF1, EF2, ensino fundamental",
  authors: [{ name: "Makarispo Serviços Tecnológicos Ltda" }],
  openGraph: {
    title: "MKTECH - Tecnologia Gamificada para Educação",
    description: "Aulas de tecnologia gamificadas para EF1/EF2",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
