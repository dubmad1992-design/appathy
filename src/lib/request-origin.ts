import { headers } from "next/headers";

export async function getRequestOrigin() {
  const store = await headers();
  const proto = store.get("x-forwarded-proto") ?? "http";
  const host = store.get("x-forwarded-host") ?? store.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}
