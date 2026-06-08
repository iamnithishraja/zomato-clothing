export interface ProductSpecificationsInput {
  material?: string;
  fit?: string;
  pattern?: string;
}

/** Strip empty specification fields so Mongoose enum validators don't reject the whole object */
export function cleanSpecifications(
  specs?: ProductSpecificationsInput
): ProductSpecificationsInput | undefined {
  if (!specs) return undefined;

  const cleaned: ProductSpecificationsInput = {};
  const material = specs.material?.trim();
  const fit = specs.fit?.trim();
  const pattern = specs.pattern?.trim();

  if (material) cleaned.material = material;
  if (fit) cleaned.fit = fit;
  if (pattern) cleaned.pattern = pattern;

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

export function isPresetMaterial(material: string, presets: string[]): boolean {
  return presets.includes(material);
}
