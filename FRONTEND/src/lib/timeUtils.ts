



export const TIME_SLOTS = [
  "6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM",
  "12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM",
  "6:00 PM","7:00 PM","8:00 PM","9:00 PM","10:00 PM",
];

export function slotIndex(t: string) { return TIME_SLOTS.indexOf(t); }
export function slotHours(start: string, end: string) { return slotIndex(end) - slotIndex(start); }
