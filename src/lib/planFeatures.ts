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
  }
];
