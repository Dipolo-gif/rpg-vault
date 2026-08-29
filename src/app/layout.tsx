import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RPG Vault",
  description:
    "Cofre pessoal de personagens de RPG de mesa: fichas, itens magicos, lore e assets.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      // O app nasce escuro. A classe fica fixa aqui em vez de vir de um
      // theme provider porque nao existe modo claro neste produto.
      className={`dark ${inter.variable} ${cinzel.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="vault-bg flex min-h-full flex-col bg-background text-foreground">
        {children}
        <Toaster theme="dark" position="top-center" richColors />
      </body>
    </html>
  );
}
