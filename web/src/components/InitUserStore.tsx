"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";

export function InitUserStore() {
  const fetchUserStatus = useUserStore((state) => state.fetchUserStatus);

  useEffect(() => {
    fetchUserStatus();
  }, [fetchUserStatus]);

  return null;
}
