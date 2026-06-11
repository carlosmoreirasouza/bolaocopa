import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <section className="grid">
      <div>
        <h1>Cadastro de usuário</h1>
        <p className="muted">Crie seu cadastro com nome, e-mail e senha para participar do bolão.</p>
        <p>
          Já possui conta? <Link href="/login">Entrar</Link>.
        </p>
      </div>
      <AuthForm mode="register" />
    </section>
  );
}
