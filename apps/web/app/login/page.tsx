"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, error, isLoading } = useAuth();
  const { t } = useI18n();

  return (
    <AuthForm
      title={t("auth.login")}
      submitLabel={t("auth.signIn")}
      error={error}
      isLoading={isLoading}
      onSubmit={async ({ email, password }) => {
        try {
          await login(email, password);
          router.push("/dashboard");
        } catch {
          // Error is surfaced via the auth context and shown in the form.
        }
      }}
      footer={
        <>
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="font-medium text-foreground underline">
            {t("auth.register")}
          </Link>
        </>
      }
    />
  );
}
