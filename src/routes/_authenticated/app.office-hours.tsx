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

export const Route = createFileRoute("/_authenticated/app/office-hours")({
  head: () => ({
    meta: [
      { title: "Office hours — KEC Connect" },
      {
        name: "description",
        content: "Book focused time with KEC alumni and final-year students, or offer slots of your own.",
      },
      { property: "og:title", content: "Office hours — KEC Connect" },
      { property: "og:description", content: "Short, focused mentoring slots." },
    ],
  }),
  component: OfficeHoursPage,
});

function OfficeHoursPage() {
  const { data: me } = useProfile();
  const { data: dir } = useDirectory();
  const qc = useQueryClient();
  const host = canHost(me);

  const [label, setLabel] = useState("Resume review");
  const [duration, setDuration] = useState("20");
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
      if (!label.trim()) throw new Error("Give the slot a label.");
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
      toast.success("Slot published.");
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
    onSuccess: () => {
      toast.success("Booked. Your mentor can see your note.");
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
      <header>
        <h1 className="text-3xl">Office hours</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Short, scheduled conversations. {host ? "Offer a slot, or book one yourself." : "Pick an open slot and add a note so your mentor can prepare."}
        </p>
      </header>

      {host && (
        <section className="space-y-4">
          <h2 className="text-xl">Create a slot</h2>
          <div className="panel grid gap-4 p-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="s-label">Label</Label>
              <Input
                id="s-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Resume review"
              />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["15", "20", "30", "45", "60"].map((d) => (
                    <SelectItem key={d} value={d}>
                      {d} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch id="s-recur" checked={recurring} onCheckedChange={setRecurring} />
              <Label htmlFor="s-recur">Repeat weekly</Label>
            </div>
            {recurring ? (
              <div className="space-y-2">
                <Label>Day</Label>
                <Select value={day} onValueChange={setDay}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                <Label htmlFor="s-time">Date and time</Label>
                <Input
                  id="s-time"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <Button onClick={() => createSlot.mutate()} disabled={createSlot.isPending}>
                {createSlot.isPending ? "Publishing…" : "Publish slot"}
              </Button>
            </div>
          </div>

          <h2 className="text-xl">Your upcoming slots</h2>
          <div className="panel divide-y divide-border">
            {mySlots.length ? (
              mySlots.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium">{s.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {when(s)} · {s.duration_minutes} min
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={s.status === "open" ? "secondary" : "default"}>{s.status}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => cancelSlot.mutate(s.id)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-sm text-muted-foreground">You haven't published any slots.</p>
            )}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xl">Open slots</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {openSlots.length ? (
            openSlots.map((s) => (
              <div key={s.id} className="panel p-5">
                <p className="font-medium">{s.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {dir?.[s.host_id]?.name ?? "Mentor"}
                  {dir?.[s.host_id]?.company ? ` · ${dir[s.host_id]!.company}` : ""}
                </p>
                <p className="mt-2 text-sm">
                  {when(s)} · {s.duration_minutes} min
                </p>

                {bookingSlot === s.id ? (
                  <div className="mt-4 space-y-3">
                    <Textarea
                      rows={3}
                      maxLength={500}
                      value={bookingNote}
                      onChange={(e) => setBookingNote(e.target.value)}
                      placeholder="Optional: what you'd like to cover."
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => book.mutate(s.id)} disabled={book.isPending}>
                        Confirm booking
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setBookingSlot(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="mt-4" onClick={() => setBookingSlot(s.id)}>
                    Book this slot
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No open slots right now.</p>
          )}
        </div>
      </section>

      {!!myBookings.data?.length && (
        <section className="space-y-4">
          <h2 className="text-xl">Your bookings</h2>
          <div className="panel divide-y divide-border">
            {myBookings.data.map((b) => {
              const slot = slots.data?.find((s) => s.id === b.slot_id);
              return (
                <div key={b.id} className="p-4">
                  <p className="font-medium">{slot?.label ?? "Slot"}</p>
                  <p className="text-sm text-muted-foreground">
                    {slot ? when(slot) : ""} · with {dir?.[slot?.host_id ?? ""]?.name ?? "mentor"}
                  </p>
                  {b.note && <p className="mt-1 text-sm text-muted-foreground">{b.note}</p>}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
