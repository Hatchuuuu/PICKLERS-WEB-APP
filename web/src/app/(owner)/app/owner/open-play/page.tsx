"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OwnerOpenPlayPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app/owner/courts?tab=open-play");
  }, [router]);

  return (
    <div className="p-8 text-center text-muted-foreground text-sm">
      Redirecting to My Courts...
    </div>
  );
}
