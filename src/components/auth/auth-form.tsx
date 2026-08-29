"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get("next") ?? "/dashboard";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInfo(null);

    if (password.length < 6) {
      toast.error("A senha precisa de pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        toast.success("Cofre destrancado");
        router.push(nextPath);
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName || email.split("@")[0] },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });
      if (error) throw error;

      // Com confirmacao de email ligada no Supabase, a sessao so vem depois
      // do clique no link. Sem confirmacao, ja volta logado.
      if (data.session) {
        toast.success("Conta criada. Bem-vindo ao cofre");
        router.push(nextPath);
        router.refresh();
      } else {
        setInfo(
          "Conta criada. Confira seu email e clique no link de confirmacao para entrar.",
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel continuar";
      toast.error(traduzErro(message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Tabs
      value={mode}
      onValueChange={(value) => {
        setMode(value as Mode);
        setInfo(null);
      }}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Entrar</TabsTrigger>
        <TabsTrigger value="signup">Criar conta</TabsTrigger>
      </TabsList>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <TabsContent value="signup" className="m-0 space-y-2">
          <Label htmlFor="displayName">Como quer ser chamado</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Mestre Nivaldo"
            autoComplete="nickname"
          />
        </TabsContent>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="minimo de 6 caracteres"
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
          />
        </div>

        {info && (
          <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
            {info}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : mode === "signin" ? (
            <LogIn />
          ) : (
            <UserPlus />
          )}
          {mode === "signin" ? "Destrancar o cofre" : "Criar meu cofre"}
        </Button>
      </form>
    </Tabs>
  );
}

function traduzErro(message: string) {
  const map: Record<string, string> = {
    "Invalid login credentials": "Email ou senha incorretos",
    "Email not confirmed": "Confirme seu email antes de entrar",
    "User already registered": "Esse email ja tem conta. Tente entrar.",
  };
  return map[message] ?? message;
}
