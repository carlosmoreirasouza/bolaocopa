import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <section className="grid">
      <div>
        <h1>Entrar</h1>
        <p className="muted">Acesse sua conta para registrar palpites e acompanhar sua pontuação.</p>
        <p>
          Ainda não tem conta? <Link href="/register">Cadastre-se</Link>.
        </p>
      </div>
      <AuthForm mode="login" />
    </section>
  );
}
