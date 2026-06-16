import { GenerateForm } from "@/components/dashboard/GenerateForm";

export const metadata = { title: "Generate · DocuGen" };

export default function GeneratePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-4xl font-bold">New documentary</h1>
      <p className="mt-2 text-white/60">
        Provide a topic — the pipeline scripts, scrapes, voices, animates and
        renders a full 21:9 cinematic master. One credit per generation.
      </p>
      <div className="mt-8">
        <GenerateForm />
      </div>
    </div>
  );
}
