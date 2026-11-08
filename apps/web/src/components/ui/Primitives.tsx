import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { ArrowUpRight } from "lucide-react";
export function Button({
  children,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "text";
}) {
  return (
    <button className={`button button--${variant}`} {...props}>
      {children}
    </button>
  );
}
export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "outline" | "text";
}) {
  return (
    <Link className={`button button--${variant}`} href={href}>
      {children}
      <ArrowUpRight size={16} />
    </Link>
  );
}
export function IconButton({
  label,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}
export function Container({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`container ${className}`} style={style}>
      {children}
    </div>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}
export function SectionHeading({
  title,
  eyebrow,
  href,
  action = "Explore all",
}: {
  title: string;
  eyebrow?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {action}
          <ArrowUpRight size={17} />
        </Link>
      )}
    </div>
  );
}
export function Input({
  label,
  id,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  error?: string;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${id}-error`} className="field-error">
          {error}
        </span>
      )}
    </label>
  );
}
export function Select({
  label,
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; id: string }) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} {...props}>
        {children}
      </select>
    </label>
  );
}
export function DemoNotice({
  children = "Original HIMATU photographs. Prices and availability remain demonstrations; purchases are unavailable.",
}: {
  children?: ReactNode;
}) {
  return (
    <p className="demo-note">
      <span aria-hidden="true">○</span> {children}
    </p>
  );
}
export function Divider() {
  return <hr className="divider" />;
}
