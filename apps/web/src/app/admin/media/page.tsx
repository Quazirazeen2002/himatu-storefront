import { MediaLibrary } from "@/components/admin/MediaLibrary";

export const metadata = {
  title: "Media Library · HIMATU Admin",
  description: "Manage product photography stored on Supabase Storage.",
};

export default function AdminMediaPage() {
  return <MediaLibrary />;
}

