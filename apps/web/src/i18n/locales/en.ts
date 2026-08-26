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
  business: {
    resolve: {
      loading: "Loading your business…",
      chooseBusiness: "Choose a business",
      startNew: "Start your business",
    },
    steps: {
      details: "Business details",
      classification: "Business category",
      branch: "Main location",
      terms: "Terms",
      team: "Team",
      review: "Review",
    },
    actions: {
      back: "Back",
      continue: "Continue",
      skip: "Skip for now",
      submit: "Submit for verification",
      retry: "Try again",
      edit: "Edit",
      finishSetup: "Finish setup",
    },
    progress: {
      step: "Step {{current}} of {{total}}",
    },
    details: {
      title: "Tell us about your business",
      displayNameLabel: "Business name",
      countryLabel: "Country",
      cityLabel: "City",
      contactPhoneLabel: "Phone number",
      contactEmailLabel: "Email (optional)",
      currencyLabel: "Currency",
      timezoneLabel: "Timezone",
    },
    classification: {
      title: "What kind of business is this?",
      categoryLabel: "Business category",
      categoryPlaceholder: "Choose a category",
      typeLabel: "Business type (optional)",
      typeNone: "No specific type",
      typeUnavailable: "No specific types are available for this category yet.",
    },
    branch: {
      title: "Your main location",
      displayNameLabel: "Location name",
      countryLabel: "Country",
      cityLabel: "City",
      addressLabel: "Address (optional)",
      missing: "Something went wrong with your business location. Please contact support.",
    },
    terms: {
      title: "Business Terms",
      agreeLabel: "I agree to the Business Terms",
      accepted: "You accepted the Business Terms.",
      unavailable:
        "The Business Terms are currently unavailable. Please check back soon before submitting your business.",
    },
    team: {
      title: "Invite your team",
      description: "You can invite team members now, or skip this and invite them later.",
      emailLabel: "Email",
      phoneLabel: "Phone number",
      roleLabel: "Role",
      invite: "Send invitation",
      revoke: "Cancel invitation",
      noInvitations: "No one has been invited yet.",
      statusInvited: "Invited",
      statusAccepted: "Joined",
      statusRevoked: "Cancelled",
      statusExpired: "Expired",
    },
    review: {
      title: "Review your business",
      businessSectionTitle: "Business",
      locationSectionTitle: "Main location",
      operatingDetailsSectionTitle: "Operating details",
      businessNameLabel: "Business name",
      categoryLabel: "Category",
      typeLabel: "Type",
      locationLabel: "Main location",
      countryLabel: "Country",
      addressLabel: "Address",
      addressNotProvided: "No address provided",
      currencyLabel: "Currency",
      timezoneLabel: "Timezone",
      termsLabel: "Terms",
      teamLabel: "Team",
      incomplete: "Please finish this step before submitting.",
    },
    submitted: {
      title: "Submitted — pending verification",
      body: "Your business has been submitted and is now pending verification. We'll let you know once it's reviewed.",
    },
    dashboard: {
      nav: {
        label: "Business Dashboard navigation",
        home: "Overview",
        profile: "Business Profile",
        locations: "Locations",
        team: "Team",
        terms: "Business Terms",
        openMenu: "Open navigation",
        closeMenu: "Close navigation",
      },
      home: {
        title: "Overview",
        termsOutstandingTitle: "One step left",
        termsOutstandingBody: "Review and accept the Business Terms to complete your setup.",
        reviewTermsAction: "Review Business Terms",
        termsUnavailableTitle: "Business Terms aren't available yet",
        termsUnavailableBody:
          "We'll let you know as soon as the Business Terms are ready to review.",
        readyBody: "Your business is set up. Use the sections below to manage it.",
      },
      entryPoints: {
        profile: "Business Profile",
        locations: "Locations",
        team: "Team",
        terms: "Business Terms",
      },
      comingSoon: {
        body: "This section isn't available yet.",
        backAction: "Back to Overview",
      },
    },
    integrityError: {
      title: "Something went wrong",
      body: "We couldn't load your business the way we expected. Please contact support.",
    },
    lifecycle: {
      notAvailable: "This isn't available right now.",
    },
    access: {
      signInRequired: "Please sign in to continue.",
    },
    errors: {
      auth_required: "Please sign in again to continue.",
      auth_forbidden: "You don't have permission to do that.",
      not_found: "We couldn't find that.",
      validation_failed: "Something about that wasn't valid. Please check and try again.",
      conflict: "That's already being processed. Please wait a moment and try again.",
      unavailable: "This is temporarily unavailable. Please try again shortly.",
      timeout: "That took longer than expected. Please try again.",
      failed: "Something didn't work. Please try again.",
    },
  },
} as const;
