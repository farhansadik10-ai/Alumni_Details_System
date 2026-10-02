import type { FormRule } from "antd";

// Column limits from db/schema.md (all varchar(100)).
export const MAX_LENGTH = {
  name: 100,
  email: 100,
  department: 100,
  current_company: 100,
  job_title: 100,
  experience: 100,
} as const;

export type LimitedField = keyof typeof MAX_LENGTH;

// No minimum is enforced by the backend; this applies to new passwords only (sign-up, profile edit), not to login.
export const PASSWORD_MIN_LENGTH = 8;

export const GRADUATION_YEAR_MIN = 1950;
export const GRADUATION_YEAR_MAX = new Date().getFullYear() + 5;

export function requiredRule(label: string): FormRule {
  return { required: true, whitespace: true, message: `Please enter ${label}` };
}

export function maxLengthRule(field: LimitedField): FormRule {
  const max = MAX_LENGTH[field];
  return { max, message: `Must be at most ${max} characters` };
}

export const emailRules: FormRule[] = [
  requiredRule("your email"),
  { type: "email", message: "Please enter a valid email" },
  maxLengthRule("email"),
];

export const nameRules: FormRule[] = [requiredRule("your name"), maxLengthRule("name")];

export const newPasswordRules: FormRule[] = [
  requiredRule("a password"),
  { min: PASSWORD_MIN_LENGTH, message: `Must be at least ${PASSWORD_MIN_LENGTH} characters` },
];

export const urlRule: FormRule = { type: "url", message: "Please enter a valid URL (https://…)" };

export const graduationYearRules: FormRule[] = [
  {
    type: "integer",
    min: GRADUATION_YEAR_MIN,
    max: GRADUATION_YEAR_MAX,
    message: `Enter a year between ${GRADUATION_YEAR_MIN} and ${GRADUATION_YEAR_MAX}`,
  },
];
