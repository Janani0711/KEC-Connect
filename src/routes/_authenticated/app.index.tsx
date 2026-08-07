import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Calendar,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  Inbox,
  Maximize2,
  MessagesSquare,
  Newspaper,
  Pause,
  Play,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DAYS, labelFor, CONNECT_TOPICS, timeAgo, useDirectory, useProfile } from "@/lib/kec";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — KEC Connect" },
      { name: "description", content: "Your KEC Connect home: questions, office hours and requests." },
      { property: "og:title", content: "Dashboard — KEC Connect" },
      { property: "og:description", content: "Your KEC Connect home." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: profile } = useProfile();
  const isAlumni = profile?.role === "alumni";
  return isAlumni ? <AlumniHome /> : <StudentHome />;
}

const VIDEOS = [
  {
    id: "video1",
    src: "/video.mp4",
    expandedSrc: "/video.mp4",
    label: "Campus Memories 🎬",
  },
  {
    id: "video2",
    src: "/new.mp4",
    expandedSrc: "/video2.mp4",
    label: "Alumni Highlights 🌟",
  },
];

/* ================= ALUMNI VIDEO HERO BANNER COMPONENT ================= */
function VideoHeroBanner({
  name,
  subtitle,
}: {
  name: string;
  subtitle: string;
}) {
  const [inBannerPlaying, setInBannerPlaying] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showInBannerOverlay, setShowInBannerOverlay] = useState(true);

  const bannerVideoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  const currentVideo = VIDEOS[activeVideoIndex];

  const nextVideo = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveVideoIndex((prev) => (prev + 1) % VIDEOS.length);
  };

  const prevVideo = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveVideoIndex((prev) => (prev - 1 + VIDEOS.length) % VIDEOS.length);
  };

  const startInBannerVideo = () => {
    setInBannerPlaying(true);
    setShowInBannerOverlay(false);
    setTimeout(() => {
      if (bannerVideoRef.current) {
        bannerVideoRef.current.play();
      }
    }, 100);
  };

  const stopInBannerVideo = () => {
    if (bannerVideoRef.current) {
      bannerVideoRef.current.pause();
    }
    setInBannerPlaying(false);
    setShowInBannerOverlay(true);
  };

  const openVideoModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bannerVideoRef.current) {
      bannerVideoRef.current.pause();
    }
    setIsModalOpen(true);
    setTimeout(() => {
      if (modalVideoRef.current) {
        modalVideoRef.current.play();
      }
    }, 100);
  };

  const closeVideoModal = () => {
    if (modalVideoRef.current) {
      modalVideoRef.current.pause();
    }
    setIsModalOpen(false);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inBannerPlaying && bannerVideoRef.current) {
      bannerVideoRef.current.muted = !isMuted;
    }
    if (isModalOpen && modalVideoRef.current) {
      modalVideoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  return (
    <>
      <section className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 bg-slate-950 text-white animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative w-full min-h-[260px] sm:min-h-[300px] md:min-h-[350px] flex items-center overflow-hidden group">
          
          {/* DEFAULT STATE: Wide Panoramic KEC Administrative Block Photo */}
          <img
            src="/admin_block_hero.png"
            alt="Kongu Engineering College Administrative Block"
            className={`absolute inset-0 w-full h-full object-cover object-center block transition-opacity duration-700 ${
              inBannerPlaying ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          />

          {/* IN-BANNER SLIDING HORIZONTAL VIDEO */}
          {inBannerPlaying && (
            <video
              key={currentVideo.src}
              ref={bannerVideoRef}
              src={currentVideo.src}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              onClick={() => setShowInBannerOverlay(!showInBannerOverlay)}
              className="absolute inset-0 w-full h-full object-cover block z-10 cursor-pointer animate-in fade-in duration-500"
            />
          )}

          {/* GRADIENT OVERLAYS */}
          <div
            className={`absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent z-20 transition-opacity duration-700 ${
              inBannerPlaying && !showInBannerOverlay ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          />
          <div
            className={`absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/20 z-20 transition-opacity duration-700 ${
              inBannerPlaying && !showInBannerOverlay ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          />

          {/* TOP RIGHT EXPAND BUTTON */}
          <button
            type="button"
            onClick={openVideoModal}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-40 inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/40 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold backdrop-blur-md transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
            title="Expand Video to Fullscreen Modal"
          >
            <Maximize2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Expand Video</span>
          </button>

          {/* IN-BANNER SLIDING ARROW BUTTONS & INDICATOR (Appears when video is playing) */}
          {inBannerPlaying && (
            <>
              {/* Left Arrow Button */}
              <button
                type="button"
                onClick={prevVideo}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-40 p-2.5 sm:p-3 rounded-full bg-slate-900/85 hover:bg-slate-900 text-white backdrop-blur-md border border-slate-700/80 shadow-xl transition-all hover:scale-110 active:scale-95 cursor-pointer"
                title="Previous Video"
              >
                <ChevronLeft className="h-5 w-5 text-emerald-400" />
              </button>

              {/* Right Arrow Button */}
              <button
                type="button"
                onClick={nextVideo}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-40 p-2.5 sm:p-3 rounded-full bg-slate-900/85 hover:bg-slate-900 text-white backdrop-blur-md border border-slate-700/80 shadow-xl transition-all hover:scale-110 active:scale-95 cursor-pointer"
                title="Next Video"
              >
                <ChevronRight className="h-5 w-5 text-emerald-400" />
              </button>

              {/* Bottom Video Badge Indicator */}
              <div
                className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-40 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-white text-xs font-semibold backdrop-blur-md shadow-lg transition-all duration-500 ${
                  !showInBannerOverlay ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-200">
                  Video {activeVideoIndex + 1} of {VIDEOS.length}: <span className="text-emerald-400 font-bold">{currentVideo.label}</span>
                </span>
              </div>
            </>
          )}

          {/* FLOATING TEXT OVERLAY CONTENT */}
          <div
            className={`relative z-30 w-full p-6 sm:p-8 md:p-10 flex flex-col justify-center min-h-[260px] sm:min-h-[300px] md:min-h-[350px] transition-all duration-700 ${
              inBannerPlaying && !showInBannerOverlay
                ? "opacity-0 translate-y-4 pointer-events-none"
                : "opacity-100 translate-y-0"
            } group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0`}
          >
            {/* Top Left Welcome Heading */}
            <div className="max-w-lg space-y-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight flex items-center gap-2 drop-shadow-md">
                Welcome back, <span className="text-[#38D399] font-extrabold">{name}!</span> 👋
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-slate-100 font-medium leading-relaxed drop-shadow-xs">
                {subtitle}
              </p>

              {/* WATCH BUTTON & CONTROLS */}
              <div className="pt-3 flex items-center gap-3">
                {!inBannerPlaying ? (
                  <button
                    type="button"
                    onClick={startInBannerVideo}
                    className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-white/50 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs sm:text-sm font-semibold transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-white ml-0.5" />
                    <span>Watch campus memories</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={stopInBannerVideo}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/40 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs sm:text-sm font-semibold transition-all shadow-md cursor-pointer"
                    >
                      <Pause className="h-4 w-4 fill-white" />
                      <span>Back to Banner</span>
                    </button>

                    <button
                      type="button"
                      onClick={toggleMute}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border border-white/20 bg-black/50 hover:bg-black/70 backdrop-blur-md text-slate-200 hover:text-white text-xs font-medium transition-all cursor-pointer"
                    >
                      {isMuted ? <VolumeX className="h-4 w-4 text-amber-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
                      <span>{isMuted ? "Unmute" : "Muted"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* POP-UP LIGHTBOX MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
          onClick={closeVideoModal}
        >
          {/* Modal Container */}
          <div
            className="relative w-full max-w-5xl bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col items-center animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Bar inside Modal */}
            <div className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-sm text-white">
                  KEC Video Spotlight — {currentVideo.label} (Full High Resolution)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Modal Sliding Controls */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold mr-2">
                  <button
                    type="button"
                    onClick={prevVideo}
                    className="p-1 rounded-full hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-slate-200 font-bold">
                    {activeVideoIndex + 1} / {VIDEOS.length}
                  </span>
                  <button
                    type="button"
                    onClick={nextVideo}
                    className="p-1 rounded-full hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="h-4 w-4 text-amber-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
                </button>

                <button
                  type="button"
                  onClick={closeVideoModal}
                  className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
                  title="Close Video Modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Video Container */}
            <div className="w-full bg-black p-2 flex items-center justify-center relative group">
              <video
                key={currentVideo.expandedSrc || currentVideo.src}
                ref={modalVideoRef}
                src={currentVideo.expandedSrc || currentVideo.src}
                controls
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-auto max-h-[75vh] object-contain rounded-2xl shadow-2xl block animate-in fade-in duration-300"
              />

              {/* Slider Floating Arrows inside Modal */}
              <button
                type="button"
                onClick={prevVideo}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-slate-700 transition-transform hover:scale-110 cursor-pointer z-20"
                title="Previous Video"
              >
                <ChevronLeft className="h-6 w-6 text-emerald-400" />
              </button>

              <button
                type="button"
                onClick={nextVideo}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-slate-700 transition-transform hover:scale-110 cursor-pointer z-20"
                title="Next Video"
              >
                <ChevronRight className="h-6 w-6 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StudentHome() {
  const { data: profile } = useProfile();
  const { data: dir } = useDirectory();

  const questions = useQuery({
    queryKey: ["questions", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const slots = useQuery({
    queryKey: ["slots", "open"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("office_hour_slots")
        .select("*")
        .eq("status", "open")
        .order("start_time", { ascending: true })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const opportunities = useQuery({
    queryKey: ["opportunities", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Welcome Hero Banner Card for Students */}
      <section className="relative overflow-hidden rounded-3xl border border-[#D5EADF]/60 bg-gradient-to-r from-[#EBF7F2] via-[#F2FAF6] to-[#E9F6F0] p-7 md:p-9 shadow-xs animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 z-10 relative">
          <div className="max-w-xl">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              Welcome back,{" "}
              <span className="text-sky-500 font-extrabold">
                {profile?.name?.split(" ")[0] || "Kiruthiya"}!
              </span>{" "}
              👋
            </h1>
            <p className="mt-2.5 text-sm md:text-base text-slate-600 leading-relaxed font-normal">
              Learn, connect and grow with our vibrant students & alumni community.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Action Cards */}
      <section className="grid gap-5 sm:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
        <Link
          to="/app/connect"
          className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBF3FE] text-[#2563EB]">
            <Users className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-sm group-hover:text-[#2563EB] transition-colors">
              Connect with Seniors
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Find alumni by branch & company to request 1:1 guidance.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#2563EB] self-end opacity-80 transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          to="/app/office-hours"
          className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E2F5EA] text-[#1F9054]">
            <CalendarClock className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-sm group-hover:text-[#1F9054] transition-colors">
              Book Office Hours
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Reserve 1:1 mentorship slots for resume review & prep.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#1F9054] self-end opacity-80 transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          to="/app/opportunities"
          className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EFF7E5] text-[#65A30D]">
            <Briefcase className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-sm group-hover:text-[#65A30D] transition-colors">
              Job Referrals
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Apply to opportunities & request employee referrals.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#65A30D] self-end opacity-80 transition-transform group-hover:translate-x-1" />
        </Link>
      </section>

      {/* Middle 2-Column Section */}
      <section className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 fill-mode-both">
        {/* Left: Recent Questions */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs min-h-[260px]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-base">Recent questions</h2>
              <Link to="/app/forum" className="text-xs font-semibold text-[#1F9054] hover:underline">
                Ask a question
              </Link>
            </div>

            {questions.data?.length ? (
              <div className="divide-y divide-slate-100">
                {questions.data.map((q) => (
                  <div key={q.id} className="py-3">
                    <Link to="/app/forum/$id" params={{ id: q.id }} className="font-semibold text-slate-800 text-sm hover:text-[#2563EB] transition-colors">
                      {q.title}
                    </Link>
                    <p className="text-xs text-slate-500 mt-1">
                      {dir?.[q.author_id]?.name ?? "Student"} · {timeAgo(q.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8 my-auto">
                <h3 className="font-bold text-slate-800 text-sm">No questions asked yet.</h3>
                <p className="text-xs text-slate-500 mt-1">Be the first to start a discussion!</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-center mt-2">
            <Link to="/app/forum" className="text-xs font-semibold text-[#1F9054] hover:underline">
              See all questions
            </Link>
          </div>
        </div>

        {/* Right: Open office-hour slots */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs min-h-[260px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-base">Open office-hour slots</h2>
            <Link to="/app/office-hours" className="text-xs font-semibold text-[#1F9054] hover:underline">
              See all
            </Link>
          </div>

          {slots.data?.length ? (
            <div className="py-4 space-y-3">
              {slots.data.slice(0, 2).map((s) => (
                <div key={s.id} className="p-4 rounded-xl border border-slate-100 bg-[#F9FCFA] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-slate-800">{s.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {dir?.[s.host_id]?.name ?? "Mentor"} · {s.duration_minutes} mins
                    </p>
                  </div>
                  <Button asChild size="sm" className="bg-[#4CAE30] hover:bg-[#429C28] text-white text-xs">
                    <Link to="/app/office-hours">Book</Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-8 my-auto">
              <div className="relative mb-3 flex items-center justify-center">
                <div className="h-20 w-20 rounded-2xl bg-[#F0FAF4] border border-[#D5EADF] flex flex-col items-center justify-center p-3 shadow-xs">
                  <div className="w-full h-3.5 bg-[#4CAE30] rounded-t-md mb-2 flex items-center justify-around px-2">
                    <span className="h-1 w-1 rounded-full bg-white" />
                    <span className="h-1 w-1 rounded-full bg-white" />
                  </div>
                  <div className="grid grid-cols-3 gap-1 w-full">
                    <div className="h-2 bg-[#67C58A] rounded-xs" />
                    <div className="h-2 bg-[#67C58A] rounded-xs" />
                    <div className="h-2 bg-[#67C58A] rounded-xs" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center border-2 border-white shadow-xs">
                  <Clock className="h-4 w-4" />
                </div>
              </div>

              <h3 className="font-bold text-slate-800 text-sm">No open slots this week.</h3>
              <p className="text-xs text-slate-500 mt-1">Check back soon for new availability!</p>
            </div>
          )}
        </div>
      </section>

      {/* Bottom 2-Column Section */}
      <section className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700 fill-mode-both">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-base">Upcoming events</h2>
            <Link to="/app/stories" className="text-xs font-semibold text-[#1F9054] hover:underline">
              See all
            </Link>
          </div>

          <div className="mt-4 flex flex-col items-center justify-center text-center py-7 px-4 rounded-2xl border border-slate-100 bg-[#F9FCFA]">
            <p className="text-sm font-semibold text-slate-700">No upcoming events scheduled.</p>
            <p className="text-xs text-slate-500 mt-1">Check back later for new workshops and alumni meetups.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-base">Latest opportunities</h2>
            <Link to="/app/opportunities" className="text-xs font-semibold text-[#1F9054] hover:underline">
              See all
            </Link>
          </div>

          {opportunities.data?.length ? (
            <div className="mt-4 space-y-3">
              {opportunities.data.map((opp) => (
                <div key={opp.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-[#F9FCFA] p-4 shadow-2xs">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-800 text-xs">
                      {opp.company?.substring(0, 3)?.toUpperCase() || "JOB"}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{opp.title}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">{opp.company} • {opp.role_type}</p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline" className="text-xs">
                    <Link to="/app/opportunities">View</Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center justify-center text-center py-7 px-4 rounded-2xl border border-slate-100 bg-[#F9FCFA]">
              <p className="text-sm font-semibold text-slate-700">No active opportunities posted.</p>
              <p className="text-xs text-slate-500 mt-1">Browse all opportunities or check back soon!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function AlumniHome() {
  const { data: profile } = useProfile();
  const { data: dir } = useDirectory();

  const connects = useQuery({
    queryKey: ["connect_requests", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connect_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const referrals = useQuery({
    queryKey: ["referral_requests", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_requests")
        .select("*")
        .eq("status", "requested")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const firstName = profile?.name?.split(" ")[0] || "Harini";
  const alumniSubtitle = [
    [profile?.job_title, profile?.company].filter(Boolean).join(" at ") || "Full Stack Developer at Cognizant",
    profile?.batch ? `Batch ${profile.batch}` : "Batch 2019–2023",
  ].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* VIDEO HERO BANNER EXCLUSIVELY FOR ALUMNI PAGE */}
      <VideoHeroBanner
        name={firstName}
        subtitle={alumniSubtitle}
      />

      {/* Quick Action Cards */}
      <section className="grid gap-5 sm:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
        <Link
          to="/app/office-hours"
          className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBF3FE] text-[#2563EB]">
            <CalendarClock className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-sm group-hover:text-[#2563EB] transition-colors">
              Set Office Hours
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Offer a slot or two to mentor KEC students this week.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#2563EB] self-end opacity-80 transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          to="/app/opportunities"
          className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E2F5EA] text-[#1F9054]">
            <Briefcase className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-sm group-hover:text-[#1F9054] transition-colors">
              Post an Opening
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Share career opportunities or offer job referrals.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#1F9054] self-end opacity-80 transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          to="/app/stories"
          className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EFF7E5] text-[#65A30D]">
            <Newspaper className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-sm group-hover:text-[#65A30D] transition-colors">
              Write a Story
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Share advice and experiences you wish you'd known.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#65A30D] self-end opacity-80 transition-transform group-hover:translate-x-1" />
        </Link>
      </section>

      {/* Middle 2-Column Section */}
      <section className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 fill-mode-both">
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs min-h-[240px]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-base">Pending connect requests</h2>
              <Link to="/app/chat" className="text-xs font-semibold text-[#1F9054] hover:underline">
                Go to chat
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {connects.data?.length ? (
                connects.data.map((c) => (
                  <div key={c.id} className="py-4">
                    <p className="font-semibold text-slate-800 text-sm">
                      {dir?.[c.from_user_id]?.name ?? "A student"}{" "}
                      <span className="font-normal text-xs text-slate-500">
                        · {labelFor(CONNECT_TOPICS, c.topic)}
                      </span>
                    </p>
                    {c.note && <p className="mt-1 text-xs text-slate-600">{c.note}</p>}
                    <Button asChild size="sm" variant="outline" className="mt-3 text-xs">
                      <Link to="/app/chat">Review request</Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-10 my-auto">
                  <p className="text-sm font-semibold text-slate-700">No pending connect requests.</p>
                  <p className="text-xs text-slate-500 mt-1">Students can reach out to connect with you.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs min-h-[240px]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-base">Pending referral requests</h2>
              <Link to="/app/referrals" className="text-xs font-semibold text-[#1F9054] hover:underline">
                Open inbox
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {referrals.data?.length ? (
                referrals.data.map((r) => (
                  <div key={r.id} className="py-4">
                    <p className="font-semibold text-slate-800 text-sm">{dir?.[r.student_id]?.name ?? "A student"}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">{r.why_note}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-10 my-auto">
                  <p className="text-sm font-semibold text-slate-700">No pending referral requests.</p>
                  <p className="text-xs text-slate-500 mt-1">Referral requests from students will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
