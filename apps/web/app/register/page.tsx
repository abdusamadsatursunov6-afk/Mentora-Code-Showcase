"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register, error, isLoading } = useAuth();
  const { t } = useI18n();

  return (
    <AuthForm
      title={t("auth.register")}
      submitLabel={t("auth.createAccount")}
      withName
      withInvite
      error={error}
      isLoading={isLoading}
      onSubmit={async ({ email, password, fullName, inviteCode }) => {
        try {
          await register(email, password, fullName, inviteCode);
          router.push("/onboarding");
        } catch {
          // Error is surfaced via the auth context and shown in the form.
        }
      }}
      footer={
        <>
          {t("auth.hasAccount")}{" "}
          <Link href="/login" className="font-medium text-foreground underline">
            {t("auth.signIn")}
          </Link>
        </>
      }
    />
  );
}
