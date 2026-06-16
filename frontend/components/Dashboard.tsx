"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Film, Clock, Trash2, ExternalLink,
  Loader2, RefreshCw, Crown, Zap
} from "lucide-react";
import { listVideos, deleteVideo } from "@/lib/api";
import { VideoGenerator } from "./VideoGenerator";
import { VideoCard } from "./VideoCard";
import toast from "react-hot-toast";
import Link from "next/link";

export function Dashboard() {
  const [showGenerator, setShowGenerator] = useState(false);
  const queryClient = useQueryClient();

  const { data: videos = [], isLoading, refetch } = useQuery({
    queryKey: ["videos"],
    queryFn: () => listVideos(0, 20),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const hasActive = data.some(
        (v) => !["completed", "failed"].includes(v.status)
      );
      return hasActive ? 5000 : false;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast.success("Video deleted");
    },
    onError: () => toast.error("Failed to delete video"),
  });

  const activeCount = videos.filter((v) => !["completed", "failed"].includes(v.status)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-display font-bold mb-1">Your Documentaries</h1>
          <p className="text-gray-400 text-sm">
            {videos.length} project{videos.length !== 1 ? "s" : ""}
            {activeCount > 0 && (
              <span className="ml-2 badge bg-brand-600/20 text-brand-400">
                {activeCount} generating
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="btn-ghost p-2.5 rounded-xl"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowGenerator(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Documentary
          </button>
        </div>
      </div>

      {/* Video Generator Modal */}
      <AnimatePresence>
        {showGenerator && (
          <VideoGenerator onClose={() => {
            setShowGenerator(false);
            queryClient.invalidateQueries({ queryKey: ["videos"] });
          }} />
        )}
      </AnimatePresence>

      {/* Video Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="bg-surface-border rounded-xl mb-4" style={{ aspectRatio: "21/9" }} />
              <div className="h-4 bg-surface-border rounded-lg w-3/4 mb-2" />
              <div className="h-3 bg-surface-border rounded-lg w-1/2" />
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-32"
        >
          <div className="w-20 h-20 bg-brand-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Film className="w-10 h-10 text-brand-600" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-3">No documentaries yet</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Create your first AI-generated documentary. Enter a topic and watch the full pipeline execute.
          </p>
          <button onClick={() => setShowGenerator(true)} className="btn-primary flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Create Your First Documentary
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onDelete={() => deleteMutation.mutate(video.id)}
            />
          ))}
        </div>
      )}

      {/* Upgrade Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 glass-card p-6 border-brand-700 bg-gradient-to-r from-brand-950/50 to-purple-950/50"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-600/20 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">Unlock the Full Pipeline</h3>
              <p className="text-gray-400 text-sm">
                30 videos/month · 4K 21:9 · DeepVideo-V1 · LivePortrait · Flux AI
              </p>
            </div>
          </div>
          <Link href="/pricing" className="btn-primary flex items-center gap-2 shrink-0">
            <Zap className="w-4 h-4" />
            Upgrade to Pro — $29/mo
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
