import { Suspense } from "react";
import { Shield, Sparkles } from "lucide-react";

import { AuthForm } from "@/components/auth/auth-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Entrar | RPG Vault",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-[0_0_40px_-12px] shadow-primary/60">
            <Shield className="size-7" />
          </div>
          <h1 className="text-display text-3xl font-semibold tracking-tight">
            RPG Vault
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Suas fichas, itens e tokens em um cofre so seu.
          </p>
        </div>

        <div className="vault-panel rounded-2xl border border-border bg-card/70 p-6 shadow-2xl backdrop-blur">
          <Suspense fallback={<Skeleton className="h-72 w-full" />}>
            <AuthForm />
          </Suspense>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Sparkles className="size-3" />
          Cada conta enxerga apenas os proprios personagens.
        </p>
      </div>
    </main>
  );
}
