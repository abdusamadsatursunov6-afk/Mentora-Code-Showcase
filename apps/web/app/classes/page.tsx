"use client";

import type { ClassroomData } from "@mentora/shared-types";
import { Button } from "@mentora/ui";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { listClassrooms } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";

export default function ClassesPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const [classes, setClasses] = useState<ClassroomData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace("/login");
      return;
    }
    listClassrooms(accessToken)
      .then((result) => setClasses(result.items))
      .finally(() => setLoading(false));
  }, [accessToken, isAuthenticated, router]);

  if (loading) {
    return <main className="grid min-h-screen place-items-center">{t("common.loading")}</main>;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4" /> {t("common.back")}
          </Button>
          <h1 className="text-2xl font-semibold">{t("classes.title")}</h1>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />
          <Button onClick={() => router.push("/classes/new")}>
            <Plus className="h-4 w-4" /> {t("classes.new")}
          </Button>
        </div>
      </header>

      {classes.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-medium">{t("classes.empty")}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            {t("classes.emptyHint")}
          </p>
          <Button className="mt-5" onClick={() => router.push("/classes/new")}>
            <Plus className="h-4 w-4" /> {t("classes.new")}
          </Button>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((classroom) => (
            <button
              key={classroom.id}
              type="button"
              onClick={() => router.push(`/classes/${classroom.id}`)}
              className="rounded-2xl border border-border bg-card p-5 text-left transition hover:border-primary/40 hover:shadow-sm"
            >
              <div className="text-lg font-semibold">{classroom.name}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {classroom.grade} · {classroom.subject_name || "—"}
              </div>
              <div className="mt-5 flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" /> {classroom.student_count} {t("classes.students")}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">{classroom.academic_year}</div>
            </button>
          ))}
        </section>
      )}
    </main>
  );
}
