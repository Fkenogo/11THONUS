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
      save: "Enregistrer les modifications",
      cancel: "Annuler",
    },
    progress: {
      step: "Étape {{current}} sur {{total}}",
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
      operatingDetailsSectionTitle: "Détails d'exploitation",
      businessNameLabel: "Nom de l'entreprise",
      categoryLabel: "Catégorie",
      typeLabel: "Type",
      locationLabel: "Emplacement principal",
      countryLabel: "Pays",
      addressLabel: "Adresse",
      addressNotProvided: "Aucune adresse fournie",
      currencyLabel: "Devise",
      timezoneLabel: "Fuseau horaire",
      termsLabel: "Conditions",
      teamLabel: "Équipe",
      incomplete: "Veuillez terminer cette étape avant de soumettre.",
    },
    submitted: {
      title: "Soumis — en attente de vérification",
      body: "Votre entreprise a été soumise et est en attente de vérification. Nous vous informerons une fois l'examen terminé.",
    },
    dashboard: {
      nav: {
        label: "Navigation du tableau de bord de l'entreprise",
        home: "Aperçu",
        profile: "Profil de l'entreprise",
        locations: "Emplacements",
        team: "Équipe",
        terms: "Conditions de l'entreprise",
        openMenu: "Ouvrir la navigation",
        closeMenu: "Fermer la navigation",
      },
      home: {
        title: "Aperçu",
        termsOutstandingTitle: "Une dernière étape",
        termsOutstandingBody:
          "Consultez et acceptez les Conditions de l'entreprise pour terminer votre configuration.",
        reviewTermsAction: "Consulter les Conditions de l'entreprise",
        termsUnavailableTitle: "Les Conditions de l'entreprise ne sont pas encore disponibles",
        termsUnavailableBody:
          "Nous vous informerons dès que les Conditions de l'entreprise seront prêtes à être consultées.",
        readyBody:
          "Votre entreprise est configurée. Utilisez les sections ci-dessous pour la gérer.",
      },
      entryPoints: {
        profile: "Profil de l'entreprise",
        locations: "Emplacements",
        team: "Équipe",
        terms: "Conditions de l'entreprise",
      },
      comingSoon: {
        body: "Cette section n'est pas encore disponible.",
        backAction: "Retour à l'aperçu",
      },
    },
    profile: {
      title: "Profil de l'entreprise",
      subtitle: "Consultez et mettez à jour les informations de votre entreprise.",
      editTitle: "Modifier le profil de l'entreprise",
      informationSectionTitle: "Informations sur l'entreprise",
      identitySectionTitle: "Identité",
      nameLabel: "Nom de l'entreprise",
      categoryLabel: "Catégorie",
      typeLabel: "Type",
      typeNone: "Aucun type spécifique",
      emailNotProvided: "Aucun e-mail fourni",
      businessCodeLabel: "Code entreprise",
      businessCodeHint:
        "Une référence interne destinée au support 11thONUS — pas un code à partager.",
    },
    locations: {
      title: "Emplacements",
      subtitle: "Consultez et mettez à jour votre emplacement principal.",
      editTitle: "Modifier l'emplacement",
    },
    teamManagement: {
      title: "Équipe",
      description: "Gérez les personnes qui ont accès à cette entreprise.",
      loading: "Chargement de votre équipe…",
      inviteAction: "Inviter un membre",
      activeSectionTitle: "Membres de l'équipe",
      pendingSectionTitle: "Invitations en attente",
      noOtherMembers: "Aucun autre membre de l'équipe pour l'instant.",
      noPendingInvitations: "Aucune invitation en attente.",
      unnamedMember: "Membre sans nom",
      invitationSentFallback: "Invitation envoyée",
      roleOwner: "Propriétaire",
      roleManager: "Gestionnaire",
      roleStaff: "Employé",
      statusActive: "Actif",
      statusPending: "En attente",
      statusAccepted: "A rejoint",
      statusRevoked: "Annulée",
      statusExpired: "Expirée",
      deliveryTypeLabel: "Comment souhaitez-vous envoyer l'invitation ?",
      emailLabel: "E-mail",
      phoneLabel: "Numéro de téléphone",
      roleLabel: "Rôle",
      sendInvitation: "Envoyer l'invitation",
      revoke: "Annuler l'invitation",
      confirmRevokeBody: "Annuler cette invitation ? Elle ne pourra plus être acceptée.",
      confirmRevokeAction: "Oui, annuler l'invitation",
      readError: {
        title: "Impossible de charger votre équipe",
        body: "Une erreur s'est produite lors du chargement de votre équipe. Veuillez réessayer.",
      },
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
  identity: {
    profile: {
      title: "Votre profil",
      subtitle: "C'est ainsi que vous pourriez apparaître dans certaines expériences 11thONUS.",
      displayNameLabel: "Nom d'affichage",
      displayNameHelp:
        "Ni un nom légal, ni une identité vérifiée, ni un nom d'utilisateur unique — juste un nom que d'autres personnes peuvent voir.",
      missing: "Vous n'avez pas encore ajouté de nom d'affichage.",
      save: "Enregistrer",
      cancel: "Annuler",
      editAction: "Modifier le nom d'affichage",
      saved: "Enregistré.",
      saving: "Enregistrement…",
      loading: "Chargement de votre profil…",
      retry: "Réessayer",
    },
    validation: {
      required: "Saisissez un nom d'affichage.",
      tooLong: "Le nom d'affichage doit comporter au maximum 50 caractères.",
    },
    errors: {
      auth_required: "Veuillez vous reconnecter pour continuer.",
      auth_forbidden: "Vous n'avez pas la permission de faire cela.",
      not_found: "Nous n'avons pas trouvé votre profil.",
      validation_failed: "Ce nom d'affichage n'est pas valide. Veuillez vérifier et réessayer.",
      conflict: "C'est déjà en cours de traitement. Veuillez patienter un instant et réessayer.",
      unavailable: "Ceci est temporairement indisponible. Veuillez réessayer sous peu.",
      timeout: "Cela a pris plus de temps que prévu. Veuillez réessayer.",
      failed: "Nous n'avons pas pu enregistrer cela. Veuillez réessayer.",
    },
  },
  mfa: {
    page: {
      title: "Vérification en deux étapes",
      loading: "Chargement…",
      retry: "Réessayer",
      signInRequired: "Veuillez vous connecter pour continuer.",
      failed: "Impossible de charger cette page. Veuillez réessayer.",
      unresolvedAuthReference:
        "Nous n'avons pas pu déterminer comment vous êtes connecté. Veuillez vous reconnecter.",
    },
    access: {
      deniedTitle: "Accès restreint",
      deniedBody:
        "Cette page est réservée aux administrateurs de la plateforme 11thONUS. Si vous pensez qu'il s'agit d'une erreur, veuillez contacter l'assistance.",
      unverifiedEmailTitle: "Adresse e-mail vérifiée requise",
      unverifiedEmailBody:
        "La vérification en deux étapes exige une adresse e-mail vérifiée sur votre compte. Vérifiez votre adresse e-mail, puis reconnectez-vous pour continuer.",
      alreadyEnrolledTitle: "La vérification en deux étapes est déjà configurée",
      alreadyEnrolledBody:
        "Votre compte dispose déjà d'une application d'authentification inscrite. Reconnectez-vous : un code vous sera demandé.",
    },
    intro: {
      title: "Protégez votre compte d'administrateur",
      body: "Configurez la vérification en deux étapes avec une application d'authentification. Désormais, la connexion exigera aussi un code de votre application.",
      begin: "Commencer",
    },
    setup: {
      title: "Scannez le code",
      body: "Scannez ce code avec votre application d'authentification, ou saisissez la clé manuellement.",
      qrLabel: "Code de vérification en deux étapes pour votre compte 11thONUS",
      manualKeyLabel: "Clé de saisie manuelle",
      manualKeyHint:
        "Votre clé change à chaque configuration — conservez-la dans votre application d'authentification pour ce compte.",
      codeLengthLabel: "Longueur du code",
      codeLengthValue: "{{length}} chiffres, renouvelé toutes les {{interval}} secondes",
      cancel: "Annuler",
      continue: "J'ai scanné le code",
    },
    verify: {
      title: "Confirmez le code",
      body: "Saisissez le code à 6 chiffres actuellement affiché dans votre application d'authentification.",
      codeLabel: "Code de vérification",
      confirm: "Confirmer",
      verifying: "Confirmation…",
      cancel: "Annuler",
      errorInvalid: "Ce code ne fonctionne pas. Vérifiez votre application et réessayez.",
      errorGeneric: "La configuration n'a pas abouti. Veuillez réessayer.",
      unverifiedEmailTitle: "Adresse e-mail vérifiée requise",
      unverifiedEmailBody:
        "L'inscription de ce compte a échoué car son adresse e-mail n'est pas vérifiée. Vérifiez votre adresse e-mail, puis reconnectez-vous pour continuer.",
    },
    completion: {
      title: "Vérification en deux étapes activée",
      body: "Pour votre sécurité, vous êtes en train d'être déconnecté. Reconnectez-vous pour continuer — un code de votre application d'authentification vous sera demandé.",
      signOutRetry: "Réessayer de se déconnecter",
      signOutFailed:
        "Nous n'avons pas pu vous déconnecter. La vérification en deux étapes est activée, mais votre session actuelle est toujours active — déconnectez-vous, puis reconnectez-vous pour qu'un code de votre application d'authentification vous soit demandé.",
    },
  },
} as const;
