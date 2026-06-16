import { DashboardLayout } from "@/components/DashboardLayout";
import { VideoJobsList } from "@/components/VideoJobsList";

export const metadata = { title: "Library — DocuGen AI" };

export default function LibraryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-display font-bold">Library</h1>
        <p className="text-white/60">Every documentary you've generated.</p>
        <VideoJobsList />
      </div>
    </DashboardLayout>
  );
}
