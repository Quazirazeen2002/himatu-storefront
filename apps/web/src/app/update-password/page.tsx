import { redirect } from "next/navigation";

export default async function UpdatePasswordRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (typeof val === "string") qs.set(key, val);
  }
  const query = qs.toString();
  redirect(`/reset-password${query ? `?${query}` : ""}`);
}
