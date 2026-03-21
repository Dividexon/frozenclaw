export const legalProfile = {
  operatorName: "",
  addressLine1: "",
  postalCode: "",
  city: "",
  country: "Deutschland",
  email: "",
  phone: "",
  vatId: "",
  responsiblePerson: "",
  betaTermsEffectiveDate: "21.03.2026",
  privacyContact: "",
} as const;

export function missingLegalFields() {
  const missing: string[] = [];

  if (!legalProfile.operatorName) missing.push("Name oder Firmenname");
  if (!legalProfile.addressLine1) missing.push("Straße und Hausnummer");
  if (!legalProfile.postalCode) missing.push("Postleitzahl");
  if (!legalProfile.city) missing.push("Ort");
  if (!legalProfile.email) missing.push("E-Mail-Adresse");

  return missing;
}

export function formatField(value: string) {
  return value.trim() || "Noch nicht hinterlegt";
}
