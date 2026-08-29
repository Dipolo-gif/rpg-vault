import Link from "next/link";
import { LogOut, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AppHeader({
  email,
  displayName,
}: {
  email: string;
  displayName: string;
}) {
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            <Shield className="size-4" />
          </span>
          <span className="text-display text-lg font-semibold tracking-tight">
            RPG Vault
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm leading-tight font-medium">{displayName}</p>
            <p className="text-xs leading-tight text-muted-foreground">
              {email}
            </p>
          </div>
          <span className="flex size-8 items-center justify-center rounded-full border border-border bg-secondary text-xs font-semibold">
            {initials}
          </span>
          <form action="/auth/signout" method="post">
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              title="Sair"
              aria-label="Sair"
            >
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
