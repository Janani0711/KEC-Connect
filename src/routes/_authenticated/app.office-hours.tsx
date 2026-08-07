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
import { Video, Calendar, Clock, CheckCircle, ExternalLink, GraduationCap, Building2, Plus, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/office-hours")({
  head: () => ({
    meta: [
      { title: "Schedule Availability — KEC Connect" },
      {
        name: "description",
        content: "Book focused 1:1 guidance slots with KEC alumni and 4th-year seniors.",
      },
      { property: "og:title", content: "Schedule Availability — KEC Connect" },
      { property: "og:description", content: "1:1 mentoring slots with 12-hour AM/PM timing & Google Meet." },
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

// 12-Hour AM/PM Date Formatter
function format12Hour(isoString: string | null) {
  if (!isoString) return "Time to be confirmed";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;

  const datePart = d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const timePart = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart} · ${timePart}`;
}

// Standard 12-Hour Preset Time Slots
const PRESET_TIMES = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
];

function convert12HrToISO(dateStr: string, time12h: string): string {
  const [time, modifier] = time12h.trim().split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  const paddedHours = String(hours).padStart(2, "0");
  const paddedMins = String(minutes || 0).padStart(2, "0");

  return new Date(`${dateStr}T${paddedHours}:${paddedMins}:00`).toISOString();
}

function OfficeHoursPage() {
  const { data: me } = useProfile();
  const { data: dir } = useDirectory();
  const qc = useQueryClient();
  const host = canHost(me);

  const [filterType, setFilterType] = useState<"all" | "alumni" | "senior">("all");
  const [label, setLabel] = useState("1:1 Career Guidance & Mock Interview");
  const [duration, setDuration] = useState("30");
  const [recurring, setRecurring] = useState(false);
  const [day, setDay] = useState("1");

  // Date selection (Default to tomorrow in YYYY-MM-DD)
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(tomorrowStr);

  // Multi-select time slots (e.g. ["09:00 AM", "02:00 PM", "06:00 PM"])
  const [selectedTimes, setSelectedTimes] = useState<string[]>(["09:00 AM", "02:00 PM"]);
  const [customTimeInput, setCustomTimeInput] = useState("");

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

  // Toggle selection of a time slot
  function toggleTimeSlot(t: string) {
    if (selectedTimes.includes(t)) {
      setSelectedTimes(selectedTimes.filter((item) => item !== t));
    } else {
      setSelectedTimes([...selectedTimes, t]);
    }
  }

  // Add custom 12-hour time
  function handleAddCustomTime() {
    if (!customTimeInput.trim()) return;
    const formatted = customTimeInput.trim().toUpperCase();
    if (!selectedTimes.includes(formatted)) {
      setSelectedTimes([...selectedTimes, formatted]);
    }
    setCustomTimeInput("");
  }

  // Publish multiple time slots in bulk
  const createMultipleSlots = useMutation({
    mutationFn: async () => {
      if (!me) throw new Error("Not signed in");
      if (!label.trim()) throw new Error("Please enter a topic / title for the slots.");
      if (!recurring && (!selectedDate || selectedTimes.length === 0)) {
        throw new Error("Please pick a date and select at least one time slot.");
      }

      if (recurring) {
        const { error } = await supabase.from("office_hour_slots").insert({
          host_id: me.id,
          label: label.trim().slice(0, 100),
          duration_minutes: Number(duration),
          is_recurring: true,
          day_of_week: Number(day),
          start_time: null,
        });
        if (error) throw error;
      } else {
        // Create an individual slot record for each selected time slot
        const recordsToInsert = selectedTimes.map((t) => ({
          host_id: me.id,
          label: `${label.trim().slice(0, 100)} (${t})`,
          duration_minutes: Number(duration),
          is_recurring: false,
          day_of_week: null,
          start_time: convert12HrToISO(selectedDate, t),
        }));

        const { error } = await supabase.from("office_hour_slots").insert(recordsToInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      const count = selectedTimes.length;
      toast.success(
        recurring
          ? "Weekly recurring slot published!"
          : `${count} availability ${count > 1 ? "slots" : "slot"} published for ${selectedDate}!`
      );
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

  // Filter open slots by Alumni vs 4th Year Senior
  const filteredOpenSlots = openSlots.filter((s) => {
    const hostProfile = dir?.[s.host_id];
    const isAlumniHost = hostProfile?.role === "alumni";
    const isSeniorHost = hostProfile?.role === "student" && (hostProfile?.year ?? 0) >= 4;

    if (filterType === "alumni") return isAlumniHost;
    if (filterType === "senior") return isSeniorHost;
    return true;
  });

  function when(s: { is_recurring: boolean; day_of_week: number | null; start_time: string | null }) {
    if (s.is_recurring) return `Every ${DAYS[s.day_of_week ?? 0]}`;
    return format12Hour(s.start_time);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <span>Schedule Availability</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            {host
              ? "Publish multiple time slots (in 12-hour AM/PM format) for students to choose from."
              : "Pick any open timing slot from KEC Alumni or 4th Year Seniors for 1:1 mentorship."}
          </p>
        </div>
      </header>

      {/* Schedule Availability Section (for Alumni and 4th-Year Seniors) */}
      {host && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>Publish Multiple Availability Slots</span>
            </h2>
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs">
              {me?.role === "alumni" ? "Alumni Host" : "4th Year Senior Host"}
            </Badge>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            {/* Slot Title & Duration */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="s-label" className="text-xs font-semibold text-slate-700">
                  Topic / Title
                </Label>
                <Input
                  id="s-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="1:1 Placement prep & resume guidance"
                  className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Slot Duration</Label>
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
            </div>

            {/* Repeat Weekly Switch */}
            <div className="flex items-center gap-3 pt-1">
              <Switch id="s-recur" checked={recurring} onCheckedChange={setRecurring} />
              <Label htmlFor="s-recur" className="text-sm font-medium text-slate-700 cursor-pointer">
                Repeat weekly on selected day
              </Label>
            </div>

            {recurring ? (
              <div className="space-y-1.5 max-w-xs">
                <Label className="text-xs font-semibold text-slate-700">Recurring Day of Week</Label>
                <Select value={day} onValueChange={setDay}>
                  <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 z-50">
                    {DAYS.map((d, i) => (
                      <SelectItem key={d} value={String(i)}>
                        Every {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              /* Specific Date & Multiple 12-Hour AM/PM Time Slots */
              <div className="space-y-4 pt-1 border-t border-slate-100">
                <div className="space-y-1.5 max-w-xs">
                  <Label htmlFor="s-date" className="text-xs font-semibold text-slate-700">
                    Select Date
                  </Label>
                  <Input
                    id="s-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm font-medium"
                  />
                </div>

                {/* Multiple 12-Hour Time Chips Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700">
                    Select Available Time Slots (12-Hour AM/PM Format)
                  </Label>
                  <p className="text-xs text-slate-500">
                    Click any time chips below to select multiple slots for students to choose from:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {PRESET_TIMES.map((t) => {
                      const isSelected = selectedTimes.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTimeSlot(t)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{t}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom 12-Hour Time Adder */}
                <div className="flex items-center gap-2 max-w-sm pt-1">
                  <Input
                    type="text"
                    value={customTimeInput}
                    onChange={(e) => setCustomTimeInput(e.target.value)}
                    placeholder="e.g. 10:30 AM or 05:30 PM"
                    className="h-9 rounded-xl bg-slate-50 border-slate-200 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddCustomTime}
                    className="h-9 text-xs rounded-xl flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Time
                  </Button>
                </div>
              </div>
            )}

            {/* Publish Action Button */}
            <div className="pt-3 border-t border-slate-100">
              <Button
                onClick={() => createMultipleSlots.mutate()}
                disabled={createMultipleSlots.isPending}
                className="h-11 px-6 bg-[#0F2847] hover:bg-[#163861] text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <span>
                  {createMultipleSlots.isPending
                    ? "Publishing Slots..."
                    : `Publish ${selectedTimes.length} Availability Slot${selectedTimes.length > 1 ? "s" : ""}`}
                </span>
              </Button>
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-900 pt-4">Your Active Published Slots</h2>
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

      {/* Open Availability Slots for Students */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">Available Mentorship Slots</h2>

          {/* Filter Chips: All vs Alumni vs 4th Year Senior */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Slots
            </button>
            <button
              onClick={() => setFilterType("alumni")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                filterType === "alumni" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Alumni</span>
            </button>
            <button
              onClick={() => setFilterType("senior")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                filterType === "senior" ? "bg-white text-amber-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>4th Year Seniors</span>
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {filteredOpenSlots.length ? (
            filteredOpenSlots.map((s) => {
              const hostProfile = dir?.[s.host_id];
              const isAlumniHost = hostProfile?.role === "alumni";
              return (
                <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{s.label}</h3>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">
                        {hostProfile?.name ?? "KEC Mentor"}
                        {hostProfile?.company ? ` · ${hostProfile.company}` : hostProfile?.branch ? ` · ${hostProfile.branch}` : ""}
                      </p>
                    </div>

                    {/* Host Category Badge */}
                    {isAlumniHost ? (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 text-[11px] font-semibold flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Alumni
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 text-[11px] font-semibold flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" /> 4th Year Senior
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-semibold text-slate-900">{when(s)}</span>
                    </div>
                    <span className="font-medium text-slate-500">{s.duration_minutes} min</span>
                  </div>

                  {bookingSlot === s.id ? (
                    <div className="space-y-3 pt-2">
                      <Textarea
                        rows={3}
                        maxLength={500}
                        value={bookingNote}
                        onChange={(e) => setBookingNote(e.target.value)}
                        placeholder="Optional note: What questions or topic would you like to cover?"
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
              );
            })
          ) : (
            <p className="text-sm text-slate-500 col-span-2 bg-white p-8 rounded-2xl border border-slate-200 text-center">
              No open slots available under this filter right now. Check back soon!
            </p>
          )}
        </div>
      </section>

      {/* Student Booked Sessions with 12-Hour AM/PM and Google Meet links */}
      {!!myBookings.data?.length && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Your Booked Mentorship Sessions</h2>
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-sm">
            {myBookings.data.map((b) => {
              const slot = slots.data?.find((s) => s.id === b.slot_id);
              const meetUrl = getGoogleMeetUrl(b.slot_id);
              const hostProfile = dir?.[slot?.host_id ?? ""];
              const isAlumniHost = hostProfile?.role === "alumni";
              return (
                <div key={b.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <p className="font-bold text-slate-900">{slot?.label ?? "1:1 Guidance Session"}</p>
                      {isAlumniHost ? (
                        <Badge className="bg-blue-50 text-blue-700 text-[10px]">Alumni</Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700 text-[10px]">4th Year Senior</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">
                      With <span className="font-semibold text-slate-800">{hostProfile?.name ?? "Mentor"}</span>
                      {hostProfile?.company ? ` (${hostProfile.company})` : ""} · <span className="font-bold text-slate-800">{slot ? when(slot) : "Scheduled"}</span>
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
