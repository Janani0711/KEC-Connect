import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DAYS, canHost, useDirectory, useProfile } from "@/lib/kec";
import { Video, Calendar, Clock, CheckCircle, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/office-hours")({
  head: () => ({
    meta: [
      { title: "Schedule Availability & Office Hours — KEC Connect" },
      {
        name: "description",
        content: "Book focused time with KEC alumni and final-year students, or schedule availability of your own.",
      },
      { property: "og:title", content: "Schedule Availability — KEC Connect" },
      { property: "og:description", content: "Short, focused mentoring slots with Google Meet." },
    ],
  }),
  component: OfficeHoursPage,
});

function getGoogleMeetUrl(id: string) {
  const clean = id.replace(/-/g, "").toLowerCase();
  const p1 = clean.slice(0, 3) || "kec";
  const p2 = clean.slice(3, 7) || "conn";
  const p3 = clean.slice(7, 10) || "meet";
  return `https://meet.google.com/${p1}-${p2}-${p3}`;
}

function OfficeHoursPage() {
  const { data: me } = useProfile();
  const { data: dir } = useDirectory();
  const qc = useQueryClient();
  const host = canHost(me);

  const [label, setLabel] = useState("Resume review & guidance");
  const [duration, setDuration] = useState("30");
  const [recurring, setRecurring] = useState(false);
  const [day, setDay] = useState("1");
  const [startTime, setStartTime] = useState("");
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);
  const [bookingNote, setBookingNote] = useState("");

  const slots = useQuery({
    queryKey: ["slots", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("office_hour_slots")
        .select("*")
        .neq("status", "cancelled")
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const myBookings = useQuery({
    queryKey: ["bookings", "mine"],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("student_id", me!.id);
      if (error) throw error;
      return data;
    },
  });

  const createSlot = useMutation({
    mutationFn: async () => {
      if (!me) throw new Error("Not signed in");
      if (!label.trim()) throw new Error("Give the slot a title.");
      if (!recurring && !startTime) throw new Error("Pick a date and time.");
      const { error } = await supabase.from("office_hour_slots").insert({
        host_id: me.id,
        label: label.trim().slice(0, 100),
        duration_minutes: Number(duration),
        is_recurring: recurring,
        day_of_week: recurring ? Number(day) : null,
        start_time: recurring ? null : new Date(startTime).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Availability scheduled & published successfully!");
      setStartTime("");
      qc.invalidateQueries({ queryKey: ["slots"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelSlot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("office_hour_slots")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["slots"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const book = useMutation({
    mutationFn: async (slotId: string) => {
      if (!me) throw new Error("Not signed in");
      const { error } = await supabase
        .from("bookings")
        .insert({ slot_id: slotId, student_id: me.id, note: bookingNote.trim() || null });
      if (error) throw error;
      const { error: e2 } = await supabase
        .from("office_hour_slots")
        .update({ status: "booked" })
        .eq("id", slotId);
      if (e2) throw e2;
    },
    onSuccess: (_, slotId) => {
      const meetLink = getGoogleMeetUrl(slotId);
      toast.success(`Booked! Google Meet link generated: ${meetLink}`);
      setBookingSlot(null);
      setBookingNote("");
      qc.invalidateQueries({ queryKey: ["slots"] });
      qc.invalidateQueries({ queryKey: ["bookings", "mine"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mySlots = (slots.data ?? []).filter((s) => s.host_id === me?.id);
  const openSlots = (slots.data ?? []).filter((s) => s.status === "open" && s.host_id !== me?.id);

  function when(s: { is_recurring: boolean; day_of_week: number | null; start_time: string | null }) {
    if (s.is_recurring) return `Every ${DAYS[s.day_of_week ?? 0]}`;
    return s.start_time ? new Date(s.start_time).toLocaleString() : "Time to be confirmed";
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <span>Schedule Availability & Office Hours</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            {host
              ? "Schedule your availability for 1:1 student guidance. Google Meet links are generated automatically."
              : "Pick an open slot to get 1:1 career guidance with alumni and join via Google Meet at the scheduled time."}
          </p>
        </div>
      </header>

      {/* Schedule Availability Section (for Hosts/Alumni) */}
      {host && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <span>Schedule Availability</span>
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="s-label" className="text-xs font-semibold text-slate-700">
                Topic / Title
              </Label>
              <Input
                id="s-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Resume review & 1:1 mentorship"
                className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 z-50">
                  {["15", "20", "30", "45", "60"].map((d) => (
                    <SelectItem key={d} value={d} className="text-sm">
                      {d} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 sm:col-span-2 pt-1">
              <Switch id="s-recur" checked={recurring} onCheckedChange={setRecurring} />
              <Label htmlFor="s-recur" className="text-sm font-medium text-slate-700 cursor-pointer">
                Repeat weekly
              </Label>
            </div>

            {recurring ? (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Day</Label>
                <Select value={day} onValueChange={setDay}>
                  <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 z-50">
                    {DAYS.map((d, i) => (
                      <SelectItem key={d} value={String(i)}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="s-time" className="text-xs font-semibold text-slate-700">
                  Date and time
                </Label>
                <Input
                  id="s-time"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm"
                />
              </div>
            )}

            <div className="sm:col-span-2 pt-2">
              <Button
                onClick={() => createSlot.mutate()}
                disabled={createSlot.isPending}
                className="h-11 px-6 bg-[#0F2847] hover:bg-[#163861] text-white font-semibold rounded-xl shadow-md transition-all"
              >
                {createSlot.isPending ? "Scheduling…" : "Schedule & Publish Availability"}
              </Button>
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-900 pt-4">Your Upcoming Slots</h2>
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-sm">
            {mySlots.length ? (
              mySlots.map((s) => {
                const meetUrl = getGoogleMeetUrl(s.id);
                return (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <div>
                      <p className="font-semibold text-slate-900">{s.label}</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span>{when(s)}</span> · <span>{s.duration_minutes} mins</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant={s.status === "open" ? "secondary" : "default"}>
                        {s.status}
                      </Badge>
                      <a
                        href={meetUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Google Meet</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => cancelSlot.mutate(s.id)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="p-6 text-sm text-slate-500">You haven't scheduled any availability slots yet.</p>
            )}
          </div>
        </section>
      )}

      {/* Open Slots for Booking */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Available Slots</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {openSlots.length ? (
            openSlots.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900">{s.label}</h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      {dir?.[s.host_id]?.name ?? "Alumni Mentor"}
                      {dir?.[s.host_id]?.company ? ` · ${dir[s.host_id]!.company}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {s.duration_minutes} min
                  </Badge>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>{when(s)}</span>
                </div>

                {bookingSlot === s.id ? (
                  <div className="space-y-3 pt-2">
                    <Textarea
                      rows={3}
                      maxLength={500}
                      value={bookingNote}
                      onChange={(e) => setBookingNote(e.target.value)}
                      placeholder="Optional: What topic or questions would you like to cover?"
                      className="text-xs rounded-xl bg-slate-50 border-slate-200"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => book.mutate(s.id)}
                        disabled={book.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg"
                      >
                        {book.isPending ? "Booking..." : "Confirm & Get Google Meet"}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs" onClick={() => setBookingSlot(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2 font-semibold text-xs rounded-xl border-blue-200 hover:bg-blue-50 text-blue-700"
                    onClick={() => setBookingSlot(s.id)}
                  >
                    Book This Slot
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 col-span-2 bg-white p-6 rounded-2xl border border-slate-200">
              No open slots available right now. Check back soon or request custom office hours!
            </p>
          )}
        </div>
      </section>

      {/* Student Bookings with Google Meet Join Buttons */}
      {!!myBookings.data?.length && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Your Booked Sessions</h2>
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-sm">
            {myBookings.data.map((b) => {
              const slot = slots.data?.find((s) => s.id === b.slot_id);
              const meetUrl = getGoogleMeetUrl(b.slot_id);
              const hostProfile = dir?.[slot?.host_id ?? ""];
              return (
                <div key={b.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <p className="font-bold text-slate-900">{slot?.label ?? "1:1 Mentorship Session"}</p>
                    </div>
                    <p className="text-xs text-slate-600">
                      With <span className="font-semibold text-slate-800">{hostProfile?.name ?? "Mentor"}</span>
                      {hostProfile?.company ? ` (${hostProfile.company})` : ""} · {slot ? when(slot) : "Scheduled"}
                    </p>
                    {b.note && <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg mt-1">"{b.note}"</p>}
                  </div>

                  <a
                    href={meetUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Google Meet</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
