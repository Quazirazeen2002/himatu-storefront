import { AuthForm } from "@/components/commerce/PreviewForms";

export const metadata = { title: "Password recovery" };

export default function ForgotPassword() {
  return <AuthForm reset />;
}
