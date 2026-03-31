import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/server-backend";

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  return clearSessionCookie(response);
}
