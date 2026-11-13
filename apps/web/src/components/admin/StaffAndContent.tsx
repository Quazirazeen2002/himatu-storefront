"use client";
import { useEffect, useState } from "react";
import { authService, type CustomerSession } from "@/lib/auth-service";
import { commerceRequest, getAllAdminProducts } from "@/lib/commerce-api";
import { figurePhotos } from "@/lib/assets";
import type { Role } from "@himatu/shared";
export function StaffRoles() {
  const [session, setSession] = useState<CustomerSession | null>(null),
    [access, setAccess] = useState<{isOwner:boolean;ownerId:string|null}>({isOwner:false,ownerId:null}),
    [search, setSearch] = useState(""),
    [staff, setStaff] = useState<
      { id: string; email: string; fullName: string; role: Role }[]
    >([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = async (token: string) =>
    setStaff(
      await commerceRequest(
        `/admin/staff?search=${encodeURIComponent(search)}`,
        { token },
      ),
    );
  useEffect(() => {
    authService
      .getSession()
      .then(async (s) => {
        setSession(s);
        if (s?.accessToken) {
          setAccess(await commerceRequest("/admin/staff/access", {token:s.accessToken}));
          await load(s.accessToken);
        }
      })
      .catch((e) => setError(e.message));
  }, []);
  return (
    <section className="admin-card">
      <h1>Staff roles</h1>
      <p>
        Only the permanent owner may assign staff roles. Administrators manage settings and invoices; moderators manage products, inventory and orders.
      </p>
      {error && (
        <p role="alert" className="staff-error">
          {error}
        </p>
      )}
      <form
        className="staff-actions"
        onSubmit={async (e) => {
          e.preventDefault();
          if (session?.accessToken)
            try {
              await load(session.accessToken);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Search failed");
            }
        }}
      >
        <label className="field">
          <span>Account email</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <button className="admin-btn admin-btn--primary">Search</button>
      </form>
      {staff.map((user) => (
        <div className="staff-actions admin-card" key={user.id}>
          <span>
            {user.fullName}{user.id === access.ownerId ? " · OWNER" : ""}
            <br />
            {user.email}
          </span>
          <label className="field">
            <span>Role for {user.email}</span>
            <select
              value={user.role}
              disabled={busy || !access.isOwner || user.id === access.ownerId || user.id === session?.user.id}
              onChange={async (e) => {
                if (!session?.accessToken) return;
                setBusy(true);
                setError("");
                try {
                  await commerceRequest(`/admin/staff/${user.id}/role`, {
                    method: "PATCH",
                    token: session.accessToken,
                    body: JSON.stringify({ role: e.target.value }),
                  });
                  await load(session.accessToken);
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Role update failed",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {["CUSTOMER", "MODERATOR", "ADMIN"].map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </label>
        </div>
      ))}
    </section>
  );
}
export function HomepageSlides() {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [media, setMedia] = useState<{
    type: "video" | "image";
    src: string;
    poster?: string;
    alt: string;
  }>({
    type: "video",
    src: "/videos/hero-anime.mp4",
    poster: "/videos/hero-anime-poster.jpg",
    alt: "HIMATU One Piece Anime Horizontal Cinematic Visual",
  });
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await commerceRequest<{
        media?: { type: "video" | "image"; src: string; poster?: string; alt: string };
        slides?: { type?: "video" | "image"; src: string; poster?: string; alt: string }[];
      }>("/content/hero");
      if (data?.media?.src) {
        setMedia({
          type: data.media.type || (data.media.src.endsWith(".mp4") ? "video" : "image"),
          src: data.media.src,
          poster: data.media.poster || "/videos/hero-anime-poster.jpg",
          alt: data.media.alt || "HIMATU Anime Hero Visual",
        });
      } else if (data?.slides?.length) {
        const first = data.slides[0];
        setMedia({
          type: first.type || (first.src.endsWith(".mp4") ? "video" : "image"),
          src: first.src,
          poster: first.poster || "/videos/hero-anime-poster.jpg",
          alt: first.alt || "HIMATU Anime Hero Visual",
        });
      }
    } catch {}
  };

  useEffect(() => {
    authService.getSession().then((s) => {
      setSession(s);
      load();
    });
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session?.accessToken) return;
    setUploading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/admin/content/hero/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || "File upload failed");
      }

      const result = await res.json();
      if (result.media) {
        setMedia(result.media);
        setMessage("Hero media uploaded and updated live on the storefront!");
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!session?.accessToken) return;
    setBusy(true);
    setMessage("");
    setError("");

    try {
      await commerceRequest("/admin/content/hero", {
        method: "PATCH",
        token: session.accessToken,
        body: JSON.stringify({ media }),
      });
      setMessage("Hero section visual settings saved successfully!");
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const resetToOnePiece = () => {
    setMedia({
      type: "video",
      src: "/videos/hero-anime.mp4",
      poster: "/videos/hero-anime-poster.jpg",
      alt: "HIMATU One Piece Anime Horizontal Cinematic Visual",
    });
    setMessage("Restored default One Piece horizontal video. Click 'Save Visual Settings' to apply.");
  };

  return (
    <section className="admin-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "20px" }}>Hero Section Banner & Video</h1>
          <p style={{ margin: 0, color: "var(--admin-muted)" }}>
            Control the cinematic visual featured at the very top of the HIMATU storefront.
          </p>
        </div>
        <button
          type="button"
          onClick={resetToOnePiece}
          className="admin-btn admin-btn--secondary"
          style={{ fontSize: "12px" }}
        >
          Reset to One Piece Video
        </button>
      </div>

      {message && (
        <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "6px", marginBottom: "16px", fontSize: "13px", fontWeight: 600 }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "6px", marginBottom: "16px", fontSize: "13px", fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Live Preview Screen */}
      <div style={{ marginBottom: "24px" }}>
        <span style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--admin-muted)", marginBottom: "8px" }}>
          Current Hero Preview ({media.type.toUpperCase()})
        </span>
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "760px",
            aspectRatio: "16 / 9",
            background: "#080808",
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid var(--admin-border, #333)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          {media.type === "video" ? (
            <video
              key={media.src}
              src={media.src}
              poster={media.poster}
              controls
              autoPlay
              muted
              loop
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <img
              key={media.src}
              src={media.src}
              alt={media.alt}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              background: "rgba(0, 0, 0, 0.75)",
              color: "#ffffff",
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              backdropFilter: "blur(4px)",
            }}
          >
            ACTIVE STOREFRONT HERO
          </div>
        </div>
      </div>

      {/* Upload and Configuration Form */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
        {/* Upload File Card */}
        <div style={{ padding: "18px", border: "1px dashed var(--admin-border, #ddd)", borderRadius: "8px", background: "var(--admin-surface, #fafafa)" }}>
          <h3 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 700 }}>
            Upload Video or Photo
          </h3>
          <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "var(--admin-muted)" }}>
            Upload an MP4 / WebM horizontal video, or JPEG / PNG / WebP banner image directly.
          </p>
          <input
            type="file"
            accept="video/mp4,video/webm,image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={handleFileUpload}
            style={{ fontSize: "12px" }}
          />
          {uploading && (
            <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "var(--admin-accent, #6366f1)", fontWeight: 600 }}>
              Uploading to Supabase Storage…
            </p>
          )}
        </div>

        {/* Direct Link & Metadata Card */}
        <div style={{ padding: "18px", border: "1px solid var(--admin-border, #eee)", borderRadius: "8px", background: "var(--admin-surface, #ffffff)" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 700 }}>
            Media Configuration
          </h3>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "4px", color: "var(--admin-muted)" }}>
              Media Type
            </label>
            <select
              value={media.type}
              onChange={(e) => setMedia({ ...media, type: e.target.value as "video" | "image" })}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "4px", border: "1px solid var(--admin-border)" }}
            >
              <option value="video">Cinematic Video (Auto-looping with sound toggle)</option>
              <option value="image">Static High-Res Photographic Banner</option>
            </select>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "4px", color: "var(--admin-muted)" }}>
              Media URL or Local Path
            </label>
            <input
              type="text"
              value={media.src}
              onChange={(e) => setMedia({ ...media, src: e.target.value })}
              placeholder="/videos/hero-anime.mp4 or https://..."
              style={{ width: "100%", padding: "8px 10px", borderRadius: "4px", border: "1px solid var(--admin-border)", fontSize: "12px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "4px", color: "var(--admin-muted)" }}>
              Accessible Description (Alt Text)
            </label>
            <input
              type="text"
              value={media.alt}
              onChange={(e) => setMedia({ ...media, alt: e.target.value })}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "4px", border: "1px solid var(--admin-border)", fontSize: "12px" }}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <button
          type="button"
          disabled={busy || uploading}
          onClick={handleSave}
          className="admin-btn admin-btn--primary"
          style={{ minWidth: "160px" }}
        >
          {busy ? "Saving Settings…" : "Save Visual Settings"}
        </button>
      </div>
    </section>
  );
}
