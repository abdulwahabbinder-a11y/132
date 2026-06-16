import { CreateVideoForm } from "@/components/CreateVideoForm";
import { DashboardLayout } from "@/components/DashboardLayout";
import { VideoJobsList } from "@/components/VideoJobsList";

export const metadata = { title: "Studio — DocuGen AI" };

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div>
          <h1 className="text-3xl font-display font-bold">Studio</h1>
          <p className="mt-2 text-white/60">
            Describe a topic. We script, scrape, narrate, and render a cinematic 21:9 documentary.
          </p>
        </div>

        <CreateVideoForm />

        <div>
          <h2 className="text-xl font-semibold mb-4">Recent renders</h2>
          <VideoJobsList />
        </div>
      </div>
    </DashboardLayout>
  );
}
