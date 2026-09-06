// Maps Supabase auth errors to product copy so provider wording never reaches the UI.
import type { AuthError } from "@supabase/supabase-js";

const BY_CODE: Record<string, string> = {
  invalid_credentials: "That email and password combination is not right. Please try again.",
  email_not_confirmed: "Please confirm your email address first. Check your inbox for the confirmation link.",
  user_already_exists: "An account with this email already exists. Sign in instead.",
  email_exists: "An account with this email already exists. Sign in instead.",
  email_address_invalid: "Please enter a valid work email address.",
  weak_password: "Please choose a stronger password of at least 8 characters.",
  same_password: "Your new password must be different from the current one.",
  signup_disabled: "New signups are not open right now. Please contact support.",
  over_email_send_rate_limit:
    "We could not send an email right now because too many were requested. Please wait a few minutes and try again.",
  over_request_rate_limit: "Too many attempts. Please wait a moment and try again.",
  otp_expired: "This link has expired. Please request a new one.",
  bad_code_verifier: "Please open the link in the same browser you requested it from, or request a new link.",
  validation_failed: "Please check the details you entered and try again.",
};

export const GENERIC_AUTH_ERROR = "Something went wrong on our side. Please try again.";

/** Friendly message for a Supabase auth error. Falls back to a generic sentence. */
export function authErrorMessage(error: Pick<AuthError, "code" | "message" | "status">): string {
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code];

  // Older responses carry no code; recognise the common messages.
  const text = error.message.toLowerCase();
  if (text.includes("rate limit")) return BY_CODE.over_email_send_rate_limit;
  if (text.includes("invalid login credentials")) return BY_CODE.invalid_credentials;
  if (text.includes("email not confirmed")) return BY_CODE.email_not_confirmed;
  if (text.includes("already registered") || text.includes("already exists")) return BY_CODE.user_already_exists;
  if (text.includes("is invalid") && text.includes("email")) return BY_CODE.email_address_invalid;
  if (text.includes("password")) return BY_CODE.weak_password;
  if (error.status === 429) return BY_CODE.over_request_rate_limit;
  return GENERIC_AUTH_ERROR;
}
