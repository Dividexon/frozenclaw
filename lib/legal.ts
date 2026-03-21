export const legalProfile = {
  operatorName: "Marius Schumacher",
  addressLine1: "Zum Bahnhof 38",
  postalCode: "28876",
  city: "Oyten",
  country: "Deutschland",
  email: "Frozenclaw9@gmail.com",
  phone: "",
  vatId: "",
  responsiblePerson: "Marius Schumacher",
  betaTermsEffectiveDate: "21.03.2026",
  privacyContact: "Frozenclaw9@gmail.com",
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
