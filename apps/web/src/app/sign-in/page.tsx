import { AuthForm } from "@/components/commerce/PreviewForms";

export const metadata = { title: "Sign in" };

export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string; next?: string }>;
}) {
  const { error, reset, next } = await searchParams;
  return (
    <AuthForm
      verificationError={error === "verification"}
      resetSuccess={reset === "success"}
      nextPath={next}
    />
  );
}
