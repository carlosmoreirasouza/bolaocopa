"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    startTransition(async () => {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Não foi possível continuar");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      {mode === "register" && (
        <label>
          Nome
          <input name="name" placeholder="Seu nome" required />
        </label>
      )}
      <label>
        E-mail
        <input name="email" placeholder="voce@email.com" required type="email" />
      </label>
      <label>
        Senha
        <input minLength={mode === "register" ? 6 : undefined} name="password" placeholder="Sua senha" required type="password" />
      </label>
      {error && <p className="error">{error}</p>}
      <button disabled={isPending} type="submit">
        {isPending ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
      </button>
    </form>
  );
}
