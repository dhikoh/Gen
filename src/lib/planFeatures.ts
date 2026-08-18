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
