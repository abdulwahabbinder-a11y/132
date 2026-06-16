"use client";

import { motion } from "framer-motion";
import { Play, Clock, Layers } from "lucide-react";

const SAMPLE_VIDEOS = [
  {
    title: "The Fall of the Roman Empire",
    scenes: 12,
    duration: "8:30",
    style: "Documentary",
    gradient: "from-amber-900 via-red-900 to-gray-900",
    tags: ["Historical Characters", "Geopolitical Maps", "Archival Photos"],
  },
  {
    title: "The Quantum Computing Revolution",
    scenes: 8,
    duration: "5:45",
    style: "Explainer",
    gradient: "from-brand-950 via-cyan-900 to-purple-900",
    tags: ["Abstract AI Art", "Flux Images", "Motion Typography"],
  },
  {
    title: "Partition of India 1947",
    scenes: 10,
    duration: "7:15",
    style: "Documentary",
    gradient: "from-orange-900 via-green-900 to-gray-900",
    tags: ["Hindi Script", "Archive.org Media", "Lip-sync Characters"],
  },
];

export function ShowcaseSection() {
  return (
    <section className="py-28 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-glow-brand opacity-50 pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="badge bg-green-600/20 text-green-400 mb-4">Sample Output</span>
          <h2 className="section-title mb-4">See What DocuAI Creates</h2>
          <p className="section-subtitle">
            Every video rendered at 21:9 cinematic ratio, 4K, with word-synced subtitles.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_VIDEOS.map((video, i) => (
            <motion.div
              key={video.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card overflow-hidden group cursor-pointer hover:border-brand-600 transition-all duration-300"
            >
              {/* Thumbnail */}
              <div
                className={`relative bg-gradient-to-br ${video.gradient}`}
                style={{ aspectRatio: "21/9" }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-full flex items-center justify-center group-hover:bg-brand-600/60 transition-all duration-300">
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2">
                  <span className="badge bg-black/60 text-white text-xs">
                    <Clock className="w-3 h-3" /> {video.duration}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-display font-semibold text-base leading-snug flex-1 mr-2">
                    {video.title}
                  </h3>
                  <span className="badge bg-brand-600/20 text-brand-400 text-xs shrink-0">
                    {video.style}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> {video.scenes} scenes
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {video.tags.map((tag) => (
                    <span key={tag} className="badge bg-surface border border-surface-border text-gray-500 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
