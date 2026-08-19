"use client";

import { Button, Card, CardContent, CardHeader, CardTitle, StatusIndicator } from "@mentora/ui";
import type { HealthData } from "@mentora/shared-types";
import { GraduationCap, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { fetchHealth } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";

type ConnectionState = "pending" | "online" | "offline";

export default function HomePage() {
  const { t } = useI18n();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [backendState, setBackendState] = useState<ConnectionState>("pending");
  const [loading, setLoading] = useState<boolean>(true);

  const check = useCallback(async () => {
    setLoading(true);
    setBackendState("pending");
    const controller = new AbortController();
    try {
      const data = await fetchHealth(controller.signal);
      setHealth(data);
      setBackendState("online");
    } catch {
      setHealth(null);
      setBackendState("offline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void check(), 0);
    return () => window.clearTimeout(timer);
  }, [check]);

  const databaseState: ConnectionState =
    backendState !== "online" ? "pending" : health?.database === "connected" ? "online" : "offline";

  const backendValue =
    backendState === "online"
      ? t("landing.online")
      : backendState === "offline"
        ? t("landing.offline")
        : t("landing.checking");

  const databaseValue =
    backendState !== "online"
      ? "—"
      : health?.database === "connected"
        ? t("landing.connected")
        : t("landing.notConnected");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <Card className="w-full max-w-xl">
        <CardHeader className="items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <GraduationCap className="h-7 w-7" aria-hidden="true" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Mentora</CardTitle>
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Education Operating System
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            {t("landing.hint")}
          </p>

          <div className="space-y-3">
            <StatusIndicator label="Backend API" value={backendValue} tone={backendState} />
            <StatusIndicator
              label={t("landing.database")}
              value={databaseValue}
              tone={databaseState}
            />
          </div>

          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={() => void check()} disabled={loading}>
              <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              {t("landing.refresh")}
            </Button>
          </div>

          <div className="flex justify-center gap-4 border-t border-border pt-4 text-sm">
            <Link href="/login" className="font-medium text-foreground underline">
              {t("auth.login")}
            </Link>
            <Link href="/register" className="font-medium text-foreground underline">
              {t("auth.register")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
