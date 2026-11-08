import { AuthForm } from "@/components/commerce/PreviewForms";

export const metadata = { title: "Create account" };

export default async function CreateAccount({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthForm create nextPath={next} />;
}
