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
      confirmPasswordLabel: "Confirmer le mot de passe",
      passwordMismatch: "Ces mots de passe ne correspondent pas. Veuillez les ressaisir.",
      createAccount: "Créer un compte",
      emailSignIn: "Se connecter par e-mail",
      switchToRegister: "Nouveau ? Créer un compte",
      switchToSignIn: "Vous avez déjà un compte ? Se connecter",
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
  business: {
    resolve: {
      loading: "Chargement de votre entreprise…",
      chooseBusiness: "Choisissez une entreprise",
      startNew: "Créer votre entreprise",
    },
    steps: {
      details: "Coordonnées de l'entreprise",
      classification: "Catégorie d'entreprise",
      branch: "Emplacement principal",
      terms: "Conditions",
      team: "Équipe",
      review: "Vérification",
    },
    actions: {
      back: "Retour",
      continue: "Continuer",
      skip: "Ignorer pour l'instant",
      submit: "Soumettre pour vérification",
      retry: "Réessayer",
      edit: "Modifier",
      finishSetup: "Terminer la configuration",
    },
    details: {
      title: "Parlez-nous de votre entreprise",
      displayNameLabel: "Nom de l'entreprise",
      countryLabel: "Pays",
      cityLabel: "Ville",
      contactPhoneLabel: "Numéro de téléphone",
      contactEmailLabel: "E-mail (optionnel)",
      currencyLabel: "Devise",
      timezoneLabel: "Fuseau horaire",
    },
    classification: {
      title: "Quel type d'entreprise est-ce ?",
      categoryLabel: "Catégorie d'entreprise",
      categoryPlaceholder: "Choisissez une catégorie",
      typeLabel: "Type d'entreprise (optionnel)",
      typeNone: "Aucun type spécifique",
      typeUnavailable: "Aucun type spécifique n'est encore disponible pour cette catégorie.",
    },
    branch: {
      title: "Votre emplacement principal",
      displayNameLabel: "Nom de l'emplacement",
      countryLabel: "Pays",
      cityLabel: "Ville",
      addressLabel: "Adresse (optionnel)",
      missing:
        "Un problème est survenu avec l'emplacement de votre entreprise. Veuillez contacter le support.",
    },
    terms: {
      title: "Conditions de l'entreprise",
      agreeLabel: "J'accepte les Conditions de l'entreprise",
      accepted: "Vous avez accepté les Conditions de l'entreprise.",
      unavailable:
        "Les Conditions de l'entreprise sont actuellement indisponibles. Veuillez revenir bientôt avant de soumettre votre entreprise.",
    },
    team: {
      title: "Invitez votre équipe",
      description:
        "Vous pouvez inviter des membres de l'équipe maintenant, ou ignorer cette étape et les inviter plus tard.",
      emailLabel: "E-mail",
      phoneLabel: "Numéro de téléphone",
      roleLabel: "Rôle",
      invite: "Envoyer l'invitation",
      revoke: "Annuler l'invitation",
      noInvitations: "Personne n'a encore été invité.",
      statusInvited: "Invité",
      statusAccepted: "A rejoint",
      statusRevoked: "Annulé",
      statusExpired: "Expiré",
    },
    review: {
      title: "Vérifiez votre entreprise",
      businessSectionTitle: "Entreprise",
      locationSectionTitle: "Emplacement principal",
      businessNameLabel: "Nom de l'entreprise",
      categoryLabel: "Catégorie",
      typeLabel: "Type",
      locationLabel: "Emplacement principal",
      termsLabel: "Conditions",
      teamLabel: "Équipe",
      incomplete: "Veuillez terminer cette étape avant de soumettre.",
    },
    submitted: {
      title: "Soumis — en attente de vérification",
      body: "Votre entreprise a été soumise et est en attente de vérification. Nous vous informerons une fois l'examen terminé.",
    },
    dashboardPlaceholder: {
      title: "Votre entreprise est configurée",
    },
    integrityError: {
      title: "Un problème est survenu",
      body: "Nous n'avons pas pu charger votre entreprise comme prévu. Veuillez contacter le support.",
    },
    lifecycle: {
      notAvailable: "Ceci n'est pas disponible pour le moment.",
    },
    access: {
      signInRequired: "Veuillez vous connecter pour continuer.",
    },
    errors: {
      auth_required: "Veuillez vous reconnecter pour continuer.",
      auth_forbidden: "Vous n'avez pas la permission de faire cela.",
      not_found: "Nous n'avons pas trouvé cela.",
      validation_failed: "Quelque chose n'était pas valide. Veuillez vérifier et réessayer.",
      conflict: "C'est déjà en cours de traitement. Veuillez patienter un instant et réessayer.",
      unavailable: "Ceci est temporairement indisponible. Veuillez réessayer sous peu.",
      timeout: "Cela a pris plus de temps que prévu. Veuillez réessayer.",
      failed: "Quelque chose n'a pas fonctionné. Veuillez réessayer.",
    },
  },
} as const;
