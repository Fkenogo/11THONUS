/**
 * English locale catalog (I18N-001) — the primary/default language and the
 * fallback for every other locale (TRD13; TRD16 §16.40).
 *
 * Namespaced, structured messages. `common` holds shared platform copy;
 * `auth` holds the AUTH-04 customer-facing sign-in surface (retrofitted from
 * previously hard-coded strings — behaviour and wording unchanged). Backend
 * event names, technical error codes and internal domain terms are NOT copied
 * here — only customer-visible strings.
 */
export const en = {
  common: {
    language: {
      label: "Language",
    },
  },
  auth: {
    signIn: {
      ariaLabel: "Sign in",
      unavailable: "Sign-in is currently unavailable.",
      signedIn: "Signed in ({{mode}}).",
      continueWithGoogle: "Continue with Google",
      emailLabel: "Email",
      passwordLabel: "Password",
      confirmPasswordLabel: "Confirm password",
      passwordMismatch: "Those passwords don't match. Please re-enter them.",
      createAccount: "Create account",
      emailSignIn: "Sign in with email",
      switchToRegister: "New here? Create account",
      switchToSignIn: "Already have an account? Sign in",
      phoneLabel: "Phone number (E.164, e.g. +257…)",
      sendCode: "Send code",
      verificationCode: "Verification code",
      verifyCode: "Verify code",
    },
    errors: {
      auth_required: "We couldn't verify your sign-in. Please try again.",
      auth_forbidden: "This account can't sign in right now. Please contact support.",
      not_found: "We couldn't complete sign-in. Please try again.",
      validation_failed: "Something about that request was invalid. Please try again.",
      conflict: "That sign-in is already being processed. Please wait a moment and retry.",
      unavailable: "Sign-in is temporarily unavailable. Please try again shortly.",
      timeout: "Sign-in is taking longer than expected. Please try again shortly.",
      failed: "Sign-in didn't work. Please try again.",
    },
  },
} as const;
