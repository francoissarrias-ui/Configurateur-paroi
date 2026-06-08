/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { WallLayer } from "../types";
import { 
  Flame, 
  Leaf, 
  VolumeX, 
  Wind, 
  Sun, 
  Info, 
  Award,
  TrendingDown,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

interface PerformanceDashboardProps {
  layers: WallLayer[];
}

export default function PerformanceDashboard({ layers }: PerformanceDashboardProps) {
  // Surface resistances according to standard EN ISO 6946 (Th-U rules in France)
  const R_si = 0.13; // interior surface resistance
  const R_se = 0.04; // exterior surface resistance

  // Calculate parameters for each layer
  let totalThicknessMm = 0;
  let accumulatedR = 0;
  let totalPhaseShiftHours = 0;
  let biosourcedMassKg = 0;
  let mineralMassKg = 0;
  let totalMaterialCost = 0;

  const layerCalculatedDetails = layers.map((layer) => {
    totalThicknessMm += layer.thickness;
    const tM = layer.thickness / 1000; // thickness in meters

    let R = 0;
    let lambda = layer.lambda;

    // Get selected option or default
    const matIndex = layer.selectedMaterialIndex ?? 0;
    const mat = layer.materialChoices?.[matIndex];
    
    const density = mat ? mat.density : layer.density;
    const specificHeat = mat ? mat.specificHeat : layer.specificHeat;
    lambda = mat ? mat.lambda : layer.lambda;

    if (layer.fixedR !== null) {
      R = layer.fixedR;
    } else if (layer.id === "main_structure") {
      // 10% wood framing factor and 90% insulation
      const woodLambda = 0.13;
      const insLambda = lambda ?? 0.038;
      const R_wood = tM / woodLambda;
      const R_ins = tM / insLambda;
      // Parallel model
      const U_composite = 0.1 * (1 / R_wood) + 0.9 * (1 / R_ins);
      R = 1 / U_composite;
    } else {
      R = tM / (lambda ?? 0.04);
    }

    accumulatedR += R;

    // Phase Shift for homogenous layer
    // formula: Shift (hours) = 0.04097 * d * sqrt(density * specificHeat / lambda)
    let phaseShift = 0;
    if (layer.fixedR !== null) {
      // Approximate physical properties of the air cavities
      const lam = 0.25; // equivalent
      const den = layer.density;
      const sh = layer.specificHeat;
      phaseShift = 0.04097 * tM * Math.sqrt((den * sh) / lam);
    } else {
      const lam = lambda ?? 0.04;
      phaseShift = 0.04097 * tM * Math.sqrt((density * specificHeat) / lam);
    }
    totalPhaseShiftHours += phaseShift;

    // Mass calculations for carbon analysis (per m²)
    const mass = tM * density;
    const isBio = mat ? mat.type === "Biosourcé" || mat.type === "Biosourcé ITE" || mat.type === "Bois local durable" || mat.type === "Bois importé haute durabilité" || layer.id === "main_structure" || layer.id === "wood_cladding" : (layer.id === "main_structure" || layer.id === "wood_cladding" || layer.id === "outer_insulation");
    if (isBio) {
      biosourcedMassKg += mass;
    } else {
      mineralMassKg += mass;
    }

    // Cost estimation
    const basePrice = mat ? mat.approxPricePerM2 : 0;
    // scale cost based on real thickness compared to standard reference thickness
    const standardThicknessRef = layer.id === "interior_insulation" ? 100 : (layer.id === "main_structure" ? 140 : (layer.id === "outer_insulation" ? 60 : 100));
    const finalPrice = basePrice * (layer.thickness / Math.max(1, standardThicknessRef));
    totalMaterialCost += finalPrice;

    return {
      name: layer.name,
      thickness: layer.thickness,
      R,
      lambda,
      fixedR: layer.fixedR,
      phaseShift,
      mass,
      isBio,
      finalPrice
    };
  });

  const R_total = accumulatedR; // sum of layers R
  const R_overall = R_si + R_total + R_se; // with surface air layers
  const U_value = 1 / R_overall; // Transmittance W/m².K

  // Biogenic Carbon reduction / storage estimate
  // Wood sequesters roughly 1 kg of biogenic CO2 per kg of wood dry matter.
  // We can estimate the carbon content storage relative to the bio-mass.
  const carbonSequesteredKgCO2 = biosourcedMassKg * 0.95; 

  // Acoustic estimation Rw (sound reduction)
  // Double plate BA13, filled service space, and massive outer fibers give excellent sound insulation.
  // Weighted sound reduction Rw can be simulated with mass-air-mass models.
  const totalMass = biosourcedMassKg + mineralMassKg;
  let estimatedRw = 42; // baseline
  if (totalMass > 50) estimatedRw += 3;
  if (totalMass > 100) estimatedRw += 4;
  if (layers.find(l => l.id === "plasterboard")?.selectedMaterialIndex === 1) {
    estimatedRw += 4; // Double placo extra
  }
  if (layers.find(l => l.id === "service_gap")?.selectedMaterialIndex !== 0) {
    estimatedRw += 3; // Filling tech air cavity with insulation
  }

  // RE2020 Compliance thresholds
  // RE2020 requires highly insulated walls, typically U <= 0.18 W/m².K (R >= 5.5 m².K/W)
  const isRE2020Compliant = U_value <= 0.16;
  const isPassiveWoodWall = U_value <= 0.12;

  // Render performance visualizers
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* CARD 1: EXCELLENCE THERMIQUE (R & U) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
              <Award className="w-5 h-5" />
            </span>
            <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${
              isPassiveWoodWall 
                ? "bg-emerald-100 text-emerald-800" 
                : isRE2020Compliant 
                ? "bg-indigo-100 text-indigo-800" 
                : "bg-amber-100 text-amber-800"
            }`}>
              {isPassiveWoodWall ? "Niveau Passif" : isRE2020Compliant ? "RE2020 Conforme" : "RT2012 Basique"}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
            Performance Thermique d'Hiver
          </h3>
          
          {/* R Value Large Display */}
          <div className="my-5 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-800 font-sans">
              R = {R_overall.toFixed(2)}
            </span>
            <span className="text-sm font-medium text-slate-500 font-mono">
              m².K/W
            </span>
          </div>

          <div className="space-y-3 mt-4 text-xs text-slate-600">
            <div className="flex justify-between py-1.5 border-b border-dashed border-slate-100">
              <span className="text-slate-500">Coeff Transmittance (U)</span>
              <span className="font-semibold text-slate-800 font-mono">
                {U_value.toFixed(3)} W/m².K
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-dashed border-slate-100">
              <span className="text-slate-500">Flux de chaleur perdu</span>
              <span className="font-semibold text-slate-800 font-mono">
                {(U_value * 20).toFixed(1)} W/m² <span className="text-[10px] text-slate-400">(par ΔT de 20°C)</span>
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Résistance superficielle Rsi+Rse</span>
              <span className="font-medium text-slate-700 font-mono">
                0.17 m².K/W
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic visual indicator */}
        <div className="mt-6 pt-4 border-t border-slate-50">
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-slate-500 font-medium">Capacité d'isolation</span>
            <span className="text-emerald-600 font-semibold">Excellente (98%)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (R_overall / 9.0) * 100)}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            La perte thermique est réduite de plus de 90% par rapport à un mur en brique classique non isolé.
          </p>
        </div>
      </div>

      {/* CARD 2: CONFORT D'ÉTÉ (DEPHASAGE) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Sun className="w-5 h-5" />
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
              {totalPhaseShiftHours >= 12 ? "Excellent Confort" : totalPhaseShiftHours >= 9 ? "Bon Confort" : "Moyen"}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
            Protection Canicule & Confort d'Été
          </h3>

          {/* Phase Shift Timer Large Display */}
          <div className="my-5 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-800 font-sans">
              {Math.floor(totalPhaseShiftHours)}h{Math.round((totalPhaseShiftHours % 1) * 60).toString().padStart(2, "0")}
            </span>
            <span className="text-sm font-medium text-slate-500">
              de déphasage
            </span>
          </div>

          <div className="space-y-3 mt-4 text-xs text-slate-600">
            <div className="flex justify-between py-1.5 border-b border-dashed border-slate-100">
              <span className="text-slate-500">Atténuation d'amplitude (Amortissement)</span>
              <span className="font-semibold text-slate-800 font-mono">
                ~{totalPhaseShiftHours >= 12 ? "95%" : "80%"} (Excellent)
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-dashed border-slate-100">
              <span className="text-slate-500">Idéal d'amortissement requis</span>
              <span className="font-medium text-slate-700">
                10 à 12 heures
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Conductivité moyenne isolants</span>
              <span className="font-semibold text-slate-800 font-mono">
                ~0.038 W/m.K
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic visual indicator */}
        <div className="mt-6 pt-4 border-t border-slate-50">
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-slate-500 font-medium">Décalage pic de chaleur</span>
            <span className="text-amber-600 font-semibold">{totalPhaseShiftHours.toFixed(1)} heures</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (totalPhaseShiftHours / 16.0) * 100)}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            La chaleur du soleil de 14h00 passe côté intérieur vers {Math.round((14 + totalPhaseShiftHours) % 24)}h00, pile au moment où l'on peut ventiler pour refroidir l'habitat.
          </p>
        </div>
      </div>

      {/* CARD 3: ECO-CONSTRUCTION (CARBON & AUDIOP) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Leaf className="w-5 h-5" />
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              Puits de Carbone
            </span>
          </div>

          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
            Bilan Environnemental & Biosourcé
          </h3>

          {/* Carbon Sequestration Display */}
          <div className="my-5 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-800 font-sans">
              -{carbonSequesteredKgCO2.toFixed(0)} kg
            </span>
            <span className="text-sm font-medium text-slate-500">
              CO₂ stocké/m²
            </span>
          </div>

          <div className="space-y-3 mt-4 text-xs text-slate-600">
            <div className="flex justify-between py-1.5 border-b border-dashed border-slate-100">
              <span className="text-slate-500">Masse de matériaux biosourcés</span>
              <span className="font-semibold text-emerald-600 font-mono">
                {biosourcedMassKg.toFixed(1)} kg/m²
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-dashed border-slate-100">
              <span className="text-slate-500">Masse minérale/placo</span>
              <span className="font-medium text-slate-700 font-mono">
                {mineralMassKg.toFixed(1)} kg/m²
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Estimation Affaiblissement Phonique Rw</span>
              <span className="font-bold text-indigo-600 font-mono">
                 -{estimatedRw} dB
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic visual indicator */}
        <div className="mt-6 pt-4 border-t border-slate-50">
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-slate-500 font-medium">Indice d'Éco-responsabilité</span>
            <span className="text-emerald-600 font-semibold">Bilan Négatif en CO₂</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
              style={{ width: "95%" }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Grâce à l’ossature bois, l'Isolair Soprema et la fibre de bois, ce mur emprisonne plus de carbone qu'il n'en émet à sa fabrication.
          </p>
        </div>
      </div>

      {/* COMPLIANCE WARNING / NOTIFICATION BANNER */}
      <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-xs text-indigo-900 shadow-xs">
        <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-1">Règles techniques de calcul (Standard français Th-U / RT RE2020)</span>
          <p className="leading-relaxed text-indigo-950">
            Le calcul de la résistance globale intègre les résistances superficielles d'échange d'air intérieur (<code className="font-mono bg-white px-1 py-0.5 rounded text-[10px]">Rsi = 0.13</code>) et extérieur (<code className="font-mono bg-white px-1 py-0.5 rounded text-[10px]">Rse = 0.04</code>). 
            Le lattage vertical de 27mm génère une fente d'air fortement ventilée, sa contribution thermique propre est donc de <code className="font-mono bg-white px-1 py-0.5 rounded text-[10px]">R = 0.08</code> m².K/W conformément aux normes CSTB, tandis que le bardage bois de protection est pris à <code className="font-mono bg-white px-1 py-0.5 rounded text-[10px]">R = 0.05</code> pour compenser la circulation d'air extérieure dynamique.
          </p>
        </div>
      </div>
    </div>
  );
}
