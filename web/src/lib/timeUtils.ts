



export const TIME_SLOTS = [
  "6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM",
  "12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM",
  "6:00 PM","7:00 PM","8:00 PM","9:00 PM","10:00 PM",
];

export function slotIndex(t: string) { return TIME_SLOTS.indexOf(t); }

// A-016 FIX: The previous implementation returned a raw array difference with
// no guards. slotHours("8:00 AM", "8:00 AM") = 0, slotHours("9 AM", "8 AM") = -1.
// Either case propagated to the booking price calculation as a zero or negative
// multiplier, making ₱0 bookings possible through a crafted request.
export function slotHours(start: string, end: string): number {
  const s = slotIndex(start);
  const e = slotIndex(end);
  if (s === -1 || e === -1) {
    throw new Error(`[slotHours] Invalid time slot: "${start}" or "${end}" not in TIME_SLOTS`);
  }
  const diff = e - s;
  if (diff <= 0) {
    throw new Error(`[slotHours] End time "${end}" must be strictly after start time "${start}"`);
  }
  return diff;
}

export function formatFullDate(dateStr: string): string {
  if (!dateStr) return "";
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  }
  return dateStr;
}
