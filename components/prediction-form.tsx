"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type PredictionFormProps = {
  matchId: string;
  defaultHomeScore?: number;
  defaultAwayScore?: number;
};

export function PredictionForm({ matchId, defaultHomeScore, defaultAwayScore }: PredictionFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          homeScore: formData.get("homeScore"),
          awayScore: formData.get("awayScore")
        })
      });
      const data = await response.json();

      if (!response.ok) {
        setIsError(true);
        setMessage(data.error ?? "Erro ao salvar palpite");
        return;
      }

      setMessage("Palpite salvo!");
      router.refresh();
    });
  }

  return (
    <form className="score-inputs" onSubmit={handleSubmit}>
      <label>
        Mandante
        <input defaultValue={defaultHomeScore ?? ""} min={0} name="homeScore" required type="number" />
      </label>
      <label>
        Visitante
        <input defaultValue={defaultAwayScore ?? ""} min={0} name="awayScore" required type="number" />
      </label>
      <button disabled={isPending} type="submit">
        {isPending ? "Salvando..." : "Salvar"}
      </button>
      {message && <span className={isError ? "error" : "success"}>{message}</span>}
    </form>
  );
}
