import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export const metadata: Metadata = {
  title: "Bolão da Copa",
  description: "Sistema de palpites para jogos da Copa do Mundo"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="pt-BR">
      <body>
        <header className="topbar">
          <Link className="brand" href="/">
            Bolão da Copa
          </Link>
          <nav>
            <Link href="/palpites">Palpites</Link>
            <Link href="/ranking">Ranking</Link>
            {user ? (
              <>
                <Link href="/dashboard">Minha área</Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login">Entrar</Link>
                <Link className="button-link" href="/register">Cadastrar</Link>
              </>
            )}
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
