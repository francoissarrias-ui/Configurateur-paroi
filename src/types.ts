/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MaterialOption {
  name: string;
  lambda: number; // W/m.K
  density: number; // kg/m³
  specificHeat: number; // J/kg.K
  carbonFootprint: "Excellent" | "Bon" | "Moyen" | "Élevé";
  type: string;
  approxPricePerM2: number; // €/m² per 100mm thickness typical
  description: string;
}

export interface WallLayer {
  id: string;
  name: string;
  description: string;
  thickness: number; // in mm
  minThickness?: number; // in mm
  maxThickness?: number; // in mm
  lambda: number | null; // W/m.K, null if fixedR is used
  fixedR: number | null; // m².K/W, null if lambda is used
  density: number; // kg/m³
  specificHeat: number; // J/kg.K
  color: string;
  patternType: "solid" | "lines" | "studs" | "fiber" | "dots" | "wood-vertical" | "air" | "membrane";
  role: string;
  dtuNotes: string;
  isConfigurable: boolean;
  materialChoices?: MaterialOption[];
  selectedMaterialIndex?: number;
}
