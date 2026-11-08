export type FieldRule = {
  label: string;
  required?: boolean;
  kind?: "email" | "phone" | "password" | "quantity" | "otp";
  max?: number;
};
export type FormErrors = Record<string, string>;
export function validate(
  values: Record<string, string>,
  rules: Record<string, FieldRule>,
): FormErrors {
  const errors: FormErrors = {};
  for (const [key, rule] of Object.entries(rules)) {
    const value = (values[key] || "").trim();
    if (rule.required && !value) errors[key] = `${rule.label} is required.`;
    else if (
      value &&
      rule.kind === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    )
      errors[key] = "Enter a valid email address.";
    else if (
      value &&
      rule.kind === "phone" &&
      !/^(?:\+?880|0)1[3-9]\d{8}$/.test(value.replace(/[\s()-]/g, ""))
    )
      errors[key] = "Enter a Bangladesh mobile number, such as 01700000000.";
    else if (
      value &&
      rule.kind === "password" &&
      (value.length < 8 || !/[A-Za-z]/.test(value) || !/\d/.test(value))
    )
      errors[key] =
        "Use at least 8 characters with at least one letter and one number.";
    else if (value && rule.kind === "otp" && !/^\d{6}$/.test(value))
      errors[key] = "Enter the 6-digit verification code.";
    else if (
      value &&
      rule.kind === "quantity" &&
      (!Number.isInteger(Number(value)) ||
        Number(value) < 1 ||
        Number(value) > 100)
    )
      errors[key] = "Enter a whole quantity from 1 to 100.";
    else if (value.length > (rule.max || 1000))
      errors[key] = `${rule.label} is too long.`;
  }
  return errors;
}
export function focusError(errors: FormErrors) {
  const first = Object.keys(errors)[0];
  if (first) document.getElementById(first)?.focus();
}
