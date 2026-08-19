"use client";

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@mentora/ui";
import Link from "next/link";
import { useState } from "react";

import { useI18n } from "@/lib/i18n-context";

export interface AuthFormProps {
  title: string;
  submitLabel: string;
  withName?: boolean;
  withInvite?: boolean;
  error: string | null;
  isLoading: boolean;
  onSubmit: (values: {
    email: string;
    password: string;
    fullName: string;
    inviteCode: string;
  }) => void;
  footer: React.ReactNode;
}

export function AuthForm({
  title,
  submitLabel,
  withName = false,
  withInvite = false,
  error,
  isLoading,
  onSubmit,
  footer,
}: AuthFormProps) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Mentora
          </Link>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit({ email, password, fullName, inviteCode });
            }}
          >
            {withName && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName">{t("auth.name")}</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={withName ? "new-password" : "current-password"}
              />
            </div>

            {withInvite && (
              <div className="space-y-1.5">
                <Label htmlFor="inviteCode">{t("auth.inviteCode")}</Label>
                <Input
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder={t("auth.invitePlaceholder")}
                  autoComplete="off"
                />
              </div>
            )}

            {error && (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
                {error.startsWith("auth.") ? t(error) : error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("auth.wait") : submitLabel}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>
        </CardContent>
      </Card>
    </main>
  );
}
