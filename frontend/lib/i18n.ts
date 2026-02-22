export type Locale = "fr" | "en";

export const translations = {
  fr: {
    verify: {
      title: "Vérification du lot",
      scoreLabel: "Complétude de la traçabilité",
      stepsTitle: "Parcours du lot",
      step: {
        HARVEST: "Récolte",
        DRYING: "Séchage",
        PACKAGING: "Conditionnement",
        EXPORT: "Export",
        IMPORT: "Import",
      },
      completed: "Complété",
      pending: "En attente",
      actor: "Acteur",
      date: "Date",
      locality: "Lieu",
      details: "Détails du lot",
      variety: "Variété",
      weight: "Poids",
      origin: "Origine",
      grade: "Grade",
      viewRecord: "Voir l’enregistrement",
      viewCertificate: "Voir le certificat du lot",
      share: "Partager",
      shareOk: "Lien copié",
      loading: "Chargement…",
      notFound: "Lot introuvable",
      error: "Une erreur s’est produite",
    },
  },
  en: {
    verify: {
      title: "Lot verification",
      scoreLabel: "Traceability completeness",
      stepsTitle: "Lot journey",
      step: {
        HARVEST: "Harvest",
        DRYING: "Drying",
        PACKAGING: "Packaging",
        EXPORT: "Export",
        IMPORT: "Import",
      },
      completed: "Completed",
      pending: "Pending",
      actor: "Actor",
      date: "Date",
      locality: "Location",
      details: "Lot details",
      variety: "Variety",
      weight: "Weight",
      origin: "Origin",
      grade: "Grade",
      viewRecord: "View record",
      viewCertificate: "View lot certificate",
      share: "Share",
      shareOk: "Link copied",
      loading: "Loading…",
      notFound: "Lot not found",
      error: "Something went wrong",
    },
  },
} as const;

export function getT(locale: Locale) {
  return translations[locale]?.verify ?? translations.fr.verify;
}
