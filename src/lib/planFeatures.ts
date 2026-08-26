/**
 * FAIL-OPEN POLICY (by design):
 * If a feature key is missing from a plan's `features` JSON, `hasFeature()` defaults to `true`.
 * This prevents false-positive gatekeeping when new features are added before all plans are updated.
 *
 * IMPORTANT: When creating a new plan via AdminPlansClient, ALL feature flags in KNOWN_PLAN_FEATURES
 * MUST be explicitly configured. The UI enforces this with a mandatory flag section in the Create modal.
 *
 * @see AdminPlansClient.tsx — featureFlagsNewPlanNote warning
 */
export interface PlanFeatureDefinition {
  key: string;
  labelKey: string;
  defaultValue: boolean;
}

export const KNOWN_PLAN_FEATURES: PlanFeatureDefinition[] = [
  {
    key: "imagePromptStudio",
    labelKey: "featureImagePromptStudio",
    defaultValue: true
  },
  {
    key: "htmlBlogExport",
    labelKey: "featureHtmlBlogExport",
    defaultValue: true
  },
  {
    key: "cameraMovementPro",
    labelKey: "featureCameraMovementPro",
    defaultValue: false   // fail-closed: new feature, no backward-compat burden
  }
];

/**
 * Fix audit 5.1: Implementasi `hasFeature()` yang selama ini direferensikan di komentar header
 * tapi tidak pernah di-export. Menggantikan duplikasi closure `getFeatureValue` di:
 * - dashboard/generator/page.tsx
 * - api/generate/route.ts
 *
 * @param features  Objek fitur mentah dari Plan.features (bisa null/undefined)
 * @param key       Kunci fitur, misal "imagePromptStudio"
 * @param isSuperadmin  Superadmin selalu mendapatkan akses penuh
 * @returns boolean sesuai FAIL-OPEN policy
 */
export function hasFeature(
  features: Record<string, boolean> | null | undefined,
  key: string,
  isSuperadmin = false
): boolean {
  if (isSuperadmin) return true;
  const rawFeatures = features ?? {};
  if (typeof rawFeatures[key] === "boolean") return rawFeatures[key];
  // Kunci tidak ditemukan — cek defaultValue dari KNOWN_PLAN_FEATURES
  const knownFeature = KNOWN_PLAN_FEATURES.find((f) => f.key === key);
  // FAIL-OPEN: jika tidak dikenal sama sekali, return true (tidak memblokir fitur baru)
  return knownFeature ? knownFeature.defaultValue : true;
}
