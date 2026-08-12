/**
 * French locale catalog (I18N-001) — the supported alternative language
 * (TRD13; TRD16 §16.40). Keys mirror `en` exactly; any key missing here falls
 * back to English per the framework's `fallbackLng` policy.
 *
 * `{{mode}}` in `signIn.signedIn` interpolates a backend outcome enum
 * (`registered`/`authenticated`) which is a technical value, not translated.
 */
export const fr = {
  common: {
    language: {
      label: "Langue",
    },
  },
  auth: {
    signIn: {
      ariaLabel: "Se connecter",
      unavailable: "La connexion est actuellement indisponible.",
      signedIn: "Connecté ({{mode}}).",
      continueWithGoogle: "Continuer avec Google",
      emailLabel: "E-mail",
      passwordLabel: "Mot de passe",
      createAccount: "Créer un compte",
      emailSignIn: "Se connecter par e-mail",
      phoneLabel: "Numéro de téléphone (E.164, p. ex. +257…)",
      sendCode: "Envoyer le code",
      verificationCode: "Code de vérification",
      verifyCode: "Vérifier le code",
    },
    errors: {
      auth_required: "Nous n'avons pas pu vérifier votre connexion. Veuillez réessayer.",
      auth_forbidden:
        "Ce compte ne peut pas se connecter pour le moment. Veuillez contacter le support.",
      not_found: "Nous n'avons pas pu finaliser la connexion. Veuillez réessayer.",
      validation_failed: "Cette demande comportait une erreur. Veuillez réessayer.",
      conflict:
        "Cette connexion est déjà en cours de traitement. Veuillez patienter un instant et réessayer.",
      unavailable: "La connexion est temporairement indisponible. Veuillez réessayer sous peu.",
      timeout: "La connexion prend plus de temps que prévu. Veuillez réessayer sous peu.",
      failed: "La connexion a échoué. Veuillez réessayer.",
    },
  },
} as const;
