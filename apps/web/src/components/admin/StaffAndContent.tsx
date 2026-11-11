"use client";
import { useEffect, useState } from "react";
import { authService, type CustomerSession } from "@/lib/auth-service";
import { commerceRequest, getAllAdminProducts } from "@/lib/commerce-api";
import type { Role } from "@himatu/shared";
export function StaffRoles() {
  const [session, setSession] = useState<CustomerSession | null>(null),
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
        if (s?.accessToken) await load(s.accessToken);
      })
      .catch((e) => setError(e.message));
  }, []);
  return (
    <section className="admin-card">
      <h1>Staff roles</h1>
      <p>
        Administrators manage staff, settings and invoice email. Moderators
        manage the catalogue, inventory and orders. Search an existing
        registered account by email.
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
            {user.fullName}
            <br />
            {user.email}
          </span>
          <label className="field">
            <span>Role for {user.email}</span>
            <select
              value={user.role}
              disabled={busy || user.id === session?.user.id}
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
  const [session, setSession] = useState<CustomerSession | null>(null),
    [options, setOptions] = useState<{ src: string; alt: string }[]>([]),
    [slides, setSlides] = useState<{ src: string; alt: string }[]>([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    authService
      .getSession()
      .then(async (s) => {
        setSession(s);
        if (!s?.accessToken) return;
        const [products, content] = await Promise.all([
          getAllAdminProducts(s.accessToken),
          commerceRequest<{ slides: { src: string; alt: string }[] }>(
            "/content/hero",
          ),
        ]);
        setOptions(
          products.flatMap((p) =>
            p.images.map((img) => ({
              src: img.imageUrl,
              alt: img.altText || p.name,
            })),
          ),
        );
        setSlides(content.slides || []);
      })
      .catch((e) => setMessage(e.message));
  }, []);
  return (
    <section className="admin-card">
      <h1>Homepage slideshow</h1>
      <p>
        Select and arrange 1–8 product photographs. The original four remain
        until you save a selection. Upload new photographs through Products →
        Photos, then select them here.
      </p>
      {message && <p role="status">{message}</p>}
      {slides.map((slide, i) => (
        <div className="admin-card" key={i}>
          <div className="staff-line">
            <img
              src={slide.src}
              alt={slide.alt}
              style={{ width: 90, height: 90, objectFit: "contain" }}
            />
            <label className="field">
              <span>Slide {i + 1} photograph</span>
              <select
                value={slide.src}
                onChange={(e) => {
                  const chosen = options.find((o) => o.src === e.target.value);
                  if (chosen)
                    setSlides(slides.map((s, j) => (j === i ? chosen : s)));
                }}
              >
                <option value={slide.src}>{slide.alt}</option>
                {options
                  .filter((o) => o.src !== slide.src)
                  .map((o, j) => (
                    <option key={j} value={o.src}>
                      {o.alt}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field">
              <span>Accessible description</span>
              <input
                value={slide.alt}
                onChange={(e) =>
                  setSlides(
                    slides.map((s, j) =>
                      j === i ? { ...s, alt: e.target.value } : s,
                    ),
                  )
                }
              />
            </label>
          </div>
          <div className="staff-actions">
            <button
              className="admin-btn admin-btn--secondary"
              disabled={i === 0}
              onClick={() => {
                const next = [...slides];
                [next[i - 1], next[i]] = [next[i], next[i - 1]];
                setSlides(next);
              }}
            >
              Move up
            </button>
            <button
              className="admin-btn admin-btn--secondary"
              disabled={i === slides.length - 1}
              onClick={() => {
                const next = [...slides];
                [next[i + 1], next[i]] = [next[i], next[i + 1]];
                setSlides(next);
              }}
            >
              Move down
            </button>
            <button
              className="admin-btn admin-btn--secondary"
              onClick={() => setSlides(slides.filter((_, j) => j !== i))}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <div className="staff-actions">
        <button
          className="admin-btn admin-btn--secondary"
          disabled={slides.length >= 8 || !options.length}
          onClick={() => setSlides([...slides, options[0]])}
        >
          Add slide
        </button>
        <button
          disabled={busy || !slides.length}
          className="admin-btn admin-btn--primary"
          onClick={async () => {
            if (!session?.accessToken) return;
            setBusy(true);
            try {
              await commerceRequest("/admin/content/hero", {
                method: "PATCH",
                token: session.accessToken,
                body: JSON.stringify({ slides }),
              });
              setMessage(
                "Slideshow saved. Refresh the homepage to see the changes.",
              );
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Save failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          Save slideshow
        </button>
      </div>
      {!options.length && (
        <p>Add product photos to make slide choices available.</p>
      )}
    </section>
  );
}
