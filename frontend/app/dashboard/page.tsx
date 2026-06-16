import { GenerationForm } from "@/components/dashboard/generation-form";
import { ProjectQueue } from "@/components/dashboard/project-queue";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Documentary Studio Dashboard</h1>
        <p className="text-slate-300">
          Generate scripts with language-aware LLM routing, then render automated documentary timelines.
        </p>
      </header>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <GenerationForm />
        <ProjectQueue />
      </div>
    </div>
  );
}
