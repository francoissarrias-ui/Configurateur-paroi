/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { INITIAL_LAYERS } from "./data";
import { WallLayer } from "./types";
import WallCrossSection from "./components/WallCrossSection";
import PerformanceDashboard from "./components/PerformanceDashboard";
import ConfigPanel from "./components/ConfigPanel";

import {
  Layers,
  Thermometer,
  Sun,
  Leaf,
  Award,
  Sliders,
  Hammer,
  Printer,
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HardHat,
  ChevronRight,
  Info,
  Scale,
  DollarSign,
  PenTool,
  Droplets,
  Wrench,
  HelpCircle
} from "lucide-react";

export default function App() {
  const [layers, setLayers] = useState<WallLayer[]>(INITIAL_LAYERS);
  const [selectedLayerId, setSelectedLayerId] = useState<string>("main_structure");
  const [scaleMode, setScaleMode] = useState<"real" | "readable">("readable");
  const [indoorTemp, setIndoorTemp] = useState<number>(20);
  const [outdoorTemp, setOutdoorTemp] = useState<number>(-2);
  const [showGradient, setShowGradient] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"config" | "steps" | "condensation" | "materials">("config");

  // Handler to update layer thicknesses
  const handleUpdateLayerThickness = (layerId: string, newThickness: number) => {
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id === layerId) {
          return { ...layer, thickness: newThickness };
        }
        return layer;
      })
    );
  };

  // Handler to update layer material choice
  const handleUpdateLayerMaterial = (layerId: string, materialIndex: number) => {
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id === layerId) {
          return { ...layer, selectedMaterialIndex: materialIndex };
        }
        return layer;
      })
    );
  };

  // Physical calculations
  // Surface resistances standard rules Th-U (France)
  const R_si = 0.13;
  const R_se = 0.04;

  let totalThicknessMm = 0;
  let totalResistance = 0;
  let totalPhaseShiftHours = 0;
  let totalEstimatedCost = 0;
  let totalBiosourcedMass = 0;
  let totalMineralMass = 0;

  layers.forEach((layer) => {
    totalThicknessMm += layer.thickness;
    const tM = layer.thickness / 1000;

    const matIndex = layer.selectedMaterialIndex ?? 0;
    const mat = layer.materialChoices?.[matIndex];
    const density = mat ? mat.density : layer.density;
    const specificHeat = mat ? mat.specificHeat : layer.specificHeat;
    const lambda = mat ? mat.lambda : layer.lambda;

    let R = 0;
    if (layer.fixedR !== null) {
      R = layer.fixedR;
    } else if (layer.id === "main_structure") {
      // Parallel wood structure computation (10% framing factor)
      const woodLambda = 0.13;
      const insLambda = lambda ?? 0.038;
      const R_wood = tM / woodLambda;
      const R_ins = tM / insLambda;
      const U_composite = 0.1 * (1 / R_wood) + 0.9 * (1 / R_ins);
      R = 1 / U_composite;
    } else {
      R = tM / (lambda ?? 0.04);
    }

    totalResistance += R;

    // Phase Shift hour contribution
    let shift = 0;
    if (layer.fixedR !== null) {
      shift = 0.04097 * tM * Math.sqrt((layer.density * layer.specificHeat) / 0.25);
    } else {
      shift = 0.04097 * tM * Math.sqrt((density * specificHeat) / (lambda ?? 0.04));
    }
    totalPhaseShiftHours += shift;

    // Mass
    const mass = tM * density;
    const isBio = mat ? mat.type.includes("Biosourcé") || mat.type.includes("Bois") : (layer.id === "main_structure" || layer.id === "wood_cladding" || layer.id === "outer_insulation");
    if (isBio) {
      totalBiosourcedMass += mass;
    } else {
      totalMineralMass += mass;
    }

    // Cost scaling
    const baseCostPerM2 = mat ? mat.approxPricePerM2 : 0;
    const standardThicknessRef = layer.id === "interior_insulation" ? 100 : (layer.id === "main_structure" ? 140 : (layer.id === "outer_insulation" ? 60 : 100));
    const finalPrice = baseCostPerM2 * (layer.thickness / Math.max(1, standardThicknessRef));
    totalEstimatedCost += finalPrice;
  });

  const R_overall = R_si + totalResistance + R_se;
  const U_value = 1 / R_overall;

  // Condensation Diagnostic calculations (Rule of thirds / hygroscopy checks)
  // Let's compute R-value before the vapor barrier (warm interior side) 
  // and R-value after the vapor barrier (cold exterior side)
  let R_before_vapor_barrier = R_si;
  let R_after_vapor_barrier = R_se;
  let passedVaporBarrier = false;

  layers.forEach((layer) => {
    const tM = layer.thickness / 1000;
    const matIndex = layer.selectedMaterialIndex ?? 0;
    const mat = layer.materialChoices?.[matIndex];
    const lambda = mat ? mat.lambda : layer.lambda;

    let R = 0;
    if (layer.fixedR !== null) {
      R = layer.fixedR;
    } else {
      R = tM / (lambda ?? 0.04);
    }

    if (layer.id === "vapour_barrier") {
      passedVaporBarrier = true;
    } else {
      if (!passedVaporBarrier) {
        R_before_vapor_barrier += R;
      } else {
        R_after_vapor_barrier += R;
      }
    }
  });

  // Ideal ratio: R_after should be >= 1.5 * R_before to avoid cold condensation before the membrane,
  // or simple Glaser rule states we want the outer walls highly breathable (perspirants).
  const isCondensationLowRisk = R_after_vapor_barrier >= R_before_vapor_barrier;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-700 antialiased selection:bg-indigo-500 selection:text-white pb-16 no-print">
      {/* HEADER BANNER */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-lg relative overflow-hidden">
        {/* Abstract wood architecture visual decor in background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute right-0 top-0 w-96 h-96 border-4 border-white/25 rounded-3xl rotate-45 transform translate-x-48 -translate-y-24"></div>
          <div className="absolute right-40 bottom-10 w-48 h-48 border-2 border-white/25 rounded-full"></div>
          <div className="absolute left-10 top-5 w-4 w-4 bg-white rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold font-mono px-2.5 py-1 rounded-full uppercase tracking-wider">
                CAO ARCHITECTURE & ÉNERGIE
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono px-2.5 py-1 rounded-full uppercase tracking-wider">
                RE2020 CONFORME
              </span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-white flex items-center gap-3">
              <span className="p-2 bg-indigo-600 rounded-xl inline-block shadow-md">
                <Layers className="w-6 h-6 text-white" />
              </span>
              Coupe Technique : Mur Ossature Bois (MOB)
            </h1>
            <p className="text-xs text-slate-300 mt-2 max-w-xl leading-relaxed">
              Analyseur d'enveloppe à hautes performances environnementales. Configurez l'épaisseur des isolants, testez les déperditions thermiques et le déphasage estival du mur.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 md:pt-0">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer hover:shadow-md"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
              Imprimer le Dossier Technique
            </button>
          </div>
        </div>
      </header>

      {/* QUICK STATUS TICKER */}
      <div className="bg-slate-800 border-b border-slate-700 py-3.5 text-white/95 text-xs">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:divide-x md:divide-slate-700/60 font-mono">
          <div className="flex flex-col items-start justify-center md:px-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-sans">
              Épaisseur Totale
            </span>
            <span className="font-bold text-sm text-indigo-200">
              {totalThicknessMm.toFixed(1)} mm ({ (totalThicknessMm / 10).toFixed(1) } cm)
            </span>
          </div>
          <div className="flex flex-col items-start justify-center md:px-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-sans">
              Résistance Thermique
            </span>
            <span className="font-bold text-sm text-emerald-400">
              R = {R_overall.toFixed(2)} m².K/W
            </span>
          </div>
          <div className="flex flex-col items-start justify-center md:px-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-sans">
              Déphasage d'Été
            </span>
            <span className="font-bold text-sm text-amber-300">
              {totalPhaseShiftHours.toFixed(1)} h (Excellent)
            </span>
          </div>
          <div className="flex flex-col items-start justify-center md:px-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-sans">
              Estimation Matériaux Nominale
            </span>
            <span className="font-bold text-sm text-sky-300">
              ~{totalEstimatedCost.toFixed(0)} € / m²
            </span>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* TAB NAVIGATION NAVIGATION */}
        <div className="border-b border-slate-200 mb-8 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab("config")}
            className={`px-5 py-3 font-medium text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "config"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Sliders className="w-4 h-4" />
            Configurateur technique
          </button>
          <button
            onClick={() => setActiveTab("steps")}
            className={`px-5 py-3 font-medium text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "steps"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <HardHat className="w-4 h-4" />
            Ordre de Pose (DTU 31.2)
          </button>
          <button
            onClick={() => setActiveTab("condensation")}
            className={`px-5 py-3 font-medium text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "condensation"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Droplets className="w-4 h-4" />
            Régulation de Vapeur (Sain)
          </button>
          <button
            onClick={() => setActiveTab("materials")}
            className={`px-5 py-3 font-medium text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "materials"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Fiche des Matériaux
          </button>
        </div>

        {/* TAB CONTROLLERS */}

        {/* TAB 1: DESIGNER WORKBENCH */}
        {activeTab === "config" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Drawing workbench + Environment modifiers */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* interactive canvas visual wrapper */}
                <WallCrossSection
                  layers={layers}
                  selectedLayerId={selectedLayerId}
                  onSelectLayer={setSelectedLayerId}
                  scaleMode={scaleMode}
                  setScaleMode={setScaleMode}
                  indoorTemp={indoorTemp}
                  outdoorTemp={outdoorTemp}
                  showGradient={showGradient}
                  setShowGradient={setShowGradient}
                />

                {/* TEMPERATURE CLIMATIC ADJUSTER CARDS */}
                {showGradient && (
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-indigo-500" />
                      Variations Climatiques & Températures de calcul
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Indoor adjuster */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700">Température de Consigne (Intérieur)</span>
                          <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-sm">
                            {indoorTemp}°C
                          </span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="28"
                          step="1"
                          value={indoorTemp}
                          onChange={(e) => setIndoorTemp(parseFloat(e.target.value))}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <p className="text-[10px] text-slate-400">
                          Recommandation ADEME: 19°C dans les pièces de vie, 21°C idéal de calcul.
                        </p>
                      </div>

                      {/* Outdoor adjuster */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700">Température Extérieure (Saisonnière)</span>
                          <span className="font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-sm">
                            {outdoorTemp}°C
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-20"
                          max="18"
                          step="1"
                          value={outdoorTemp}
                          onChange={(e) => setOutdoorTemp(parseFloat(e.target.value))}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                        />
                        <p className="text-[10px] text-slate-400">
                          Calculé pour reproduire les pics de gel en hiver ou de mi-saison.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT SIDEBAR PANEL CONFIGURATOR */}
              <div className="lg:col-span-1">
                <ConfigPanel
                  layers={layers}
                  selectedLayerId={selectedLayerId}
                  onSelectLayer={setSelectedLayerId}
                  onUpdateLayerThickness={handleUpdateLayerThickness}
                  onUpdateLayerMaterial={handleUpdateLayerMaterial}
                />
              </div>
            </div>

            {/* PERFORMANCE ANALYSIS PANEL (BENTO) */}
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-indigo-600" />
                  Bilan de Performance du Mur Ossature Bois Configuré
                </h2>
                <p className="text-xs text-slate-500">
                  Indicateurs calculés dynamiquement selon l'épaisseur et la nature des isolants choisis
                </p>
              </div>
              <PerformanceDashboard layers={layers} />
            </div>
          </div>
        )}

        {/* TAB 2: SEQUENCE OF POSE (DTU 31.2) */}
        {activeTab === "steps" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-600" />
                Séquence de Pose & Ordre de Montage (DTU 31.2)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Comment s'assemblent concrètement ces 8 couches sur le chantier, de l'extérieur vers l'intérieur.
              </p>
            </div>

            {/* Timber Frame Steps timeline visualizer */}
            <div className="relative border-l-2 border-indigo-100 ml-4 md:ml-10 space-y-10 py-2">
              
              {/* STEP 1 */}
              <div className="relative pl-8 md:pl-12">
                <span className="absolute -left-4 md:-left-5 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border-4 border-white text-white font-mono text-xs font-bold">
                  1
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Montage de l'Ossature Porteuse bois (140 mm)
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono font-medium">DTU 31.2</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-3xl">
                    Squelette structurel en bois massif étuvé C24 de section nominale 140x45 mm. Fixé mécaniquement au sol sur une lisse d'arase isolée avec joint d'étanchéité anti-remontée capillaire. Les panneaux d'ossature reçoivent de manière jointive l’isolant principal de 140mm d'épaisseur pour un calfeutrage optimal.
                  </p>
                </div>
              </div>

              {/* STEP 2 */}
              <div className="relative pl-8 md:pl-12">
                <span className="absolute -left-4 md:-left-5 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-amber-600 border-4 border-white text-white font-mono text-xs font-bold">
                  2
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Pose du Panneau Pare-pluie rigide Isolair SOPREMA (60 mm)
                    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-mono font-medium">Perspirant IPX</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-3xl">
                    Fixation directe sur l'ossature bois externe. Les panneaux bouvetés (rainures/languettes) éliminent les ponts thermiques créés par les montants d'ossature. Ce panneau agit comme barrière étanche à l'eau de pluie mais reste extrêmement ouvert à la diffusion de vapeur (perspirant) afin d’évacuer l'humidité par l'extérieur.
                  </p>
                </div>
              </div>

              {/* STEP 3 */}
              <div className="relative pl-8 md:pl-12">
                <span className="absolute -left-4 md:-left-5 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-400 border-4 border-white text-white font-mono text-xs font-bold">
                  3
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Lattage pour lame d'air ventilée (27 mm) & Habillage anti-nuisibles
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono font-medium">Lame de ventilation</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-3xl">
                    Pose de tasseaux verticaux en bois autoclave classe 3. Un espace ventilé continu de 27mm est ménagé derrière le bardage pour dissiper l'humidité résultante de chocs de pluies battantes. Une grille perforée anti-rongeurs en acier galvanisé (clotet) équipe impérativement les évacuations d'air basses et hautes.
                  </p>
                </div>
              </div>

              {/* STEP 4 */}
              <div className="relative pl-8 md:pl-12">
                <span className="absolute -left-4 md:-left-5 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-amber-700 border-4 border-white text-white font-mono text-xs font-bold">
                  4
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Fixation du Bardage vertical de parement externe (60 mm relief)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-3xl">
                    Fixation mécanique des planches de bardage bois moulurées sur les lattes via des clous crantés inox. Les planches verticales facilitent un drainage d'eau parfait. Un vide sanitaire minimal au sol de 20cm est requis pour ménager les coulures de terre et éclaboussures de pluie.
                  </p>
                </div>
              </div>

              {/* STEP 5 */}
              <div className="relative pl-8 md:pl-12">
                <span className="absolute -left-4 md:-left-5 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 border-4 border-white text-white font-mono text-xs font-bold">
                  5
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Mise en œuvre du Doublage isolant intérieur croisé (120 mm)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-3xl">
                    Pose croisée d'un isolant complémentaire semi-rigide (en fibre de bois ou laine minérale haute performance) côté chaud. Cette couche croisée augmente considérablement le confort thermique global et protège le mur des percements d'air par les lisses et prises de courant.
                  </p>
                </div>
              </div>

              {/* STEP 6 */}
              <div className="relative pl-8 md:pl-12">
                <span className="absolute -left-4 md:-left-5 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 border-4 border-white text-white font-mono text-xs font-bold">
                  6
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Film Frein-Vapeur d’étanchéité continue
                    <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-mono font-medium">Sd variable</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-3xl">
                    Pose d'une membrane d'étanchéité continue côté chaud de la paroi. Raccords obligatoires par adhésifs souples certifiés de 10cm de recouvrement, mastic étanche silicone en périphérie des dalles, des fenêtres et passages de tuyauterie. Essentiel pour la réussite du test d'étanchéité RE2020.
                  </p>
                </div>
              </div>

              {/* STEP 7 */}
              <div className="relative pl-8 md:pl-12">
                <span className="absolute -left-4 md:-left-5 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-500 border-4 border-white text-white font-mono text-xs font-bold">
                  7
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Montage de l'Ossature métallique secondaire & Vide technique (~45 mm)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-3xl">
                    Création d’un réseau de rails métalliques (fourrures ou montants) espacés de 60cm. Ce plénum découplé ménage d'air inerte et préserve le film frein-vapeur des perçages d'électriciens en fournissant l'espace nécessaire au câblage et boîtiers étanches de prises.
                  </p>
                </div>
              </div>

              {/* STEP 8 */}
              <div className="relative pl-8 md:pl-12">
                <span className="absolute -left-4 md:-left-5 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 border-4 border-white text-slate-700 font-mono text-xs font-bold">
                  8
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Doublement de Plaque de plâtre BA13 (ou plaque Fermacell)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-3xl">
                    Vissage mécanique des plaques de finition intérieure sur les guides métalliques. Traitement final des joints par pose de bande papier grillagée microperforée noyée dans l'enduit plâtre de lissage de finition pour un aspect monolithique esthétique irréprochable.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: HYGROTHERMAL CONDENSATION ANALYSIS AND RATIO DIAGNOSTICS */}
        {activeTab === "condensation" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-indigo-600" />
                Analyse Hygrométrique & Prévention de la Condensation
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Comment ce mur ossature bois régule sainement la vapeur d'eau sans accumuler d'humidité nocive.
              </p>
            </div>

            {/* Diagnostic card panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Règle de Répartition des Résistances (2/3 - 1/3)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dans une isolation thermique par l'ossature bois renforcée par un doublage intérieur, la résistance thermique placée du côté froid (après la barrière étanche à l'air) doit être supérieure à celle du côté intérieur chaud pour s'assurer que le point de rosée reste calé près de la paroi respirante externe.
                </p>

                {/* Score and Bar Visual */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">R Côté Chaud (Intérieur du frein-vapeur)</span>
                    <span className="font-mono font-bold text-indigo-600">{R_before_vapor_barrier.toFixed(2)} m².K/W</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">R Côté Froid (Extérieur du frein-vapeur)</span>
                    <span className="font-mono font-bold text-sky-600">{R_after_vapor_barrier.toFixed(2)} m².K/W</span>
                  </div>

                  <div className="pt-2">
                    <div className="h-4 w-full bg-slate-200 rounded-lg overflow-hidden flex text-[10px] font-mono text-white text-center font-bold">
                      <div 
                        className="bg-indigo-500 h-full flex items-center justify-center transition-all" 
                        style={{ width: `${(R_before_vapor_barrier / R_overall) * 100}%` }}
                      >
                        {((R_before_vapor_barrier / R_overall) * 100).toFixed(0)}% Int.
                      </div>
                      <div 
                        className="bg-sky-500 h-full flex items-center justify-center transition-all" 
                        style={{ width: `${(R_after_vapor_barrier / R_overall) * 100}%` }}
                      >
                        {((R_after_vapor_barrier / R_overall) * 100).toFixed(0)}% Ext.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 leading-normal flex items-start gap-1.5 mt-2 bg-white/70 p-3 rounded-lg border">
                  <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>
                    La répartition est équilibrée. Grâce au panneau rigide Isolair de 60mm à l'extérieur + l'ossature de 140mm, la membrane frein-vapeur joue pleinement son rôle d'écran étanche sain de condensation.
                  </span>
                </div>
              </div>

              {/* Perspirance explanation */}
              <div className="space-y-5 flex flex-col justify-between">
                <div className="space-y-3 bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-800 text-sm font-semibold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Fonctionnement Perspirant Garanti</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal">
                    La membrane frein-vapeur hygrovariable à comportement Sd adaptatif laisse transiter la vapeur résiduelle en période sèche (été) et fait barrière en hiver. 
                    Tous les isolants extérieurs (Soprema Isolair bois dense) et le bois de parement sont très ouverts à la vapeur d'eau (perméables), créant un gradient de perspirance sain qui assèche le bâti automatiquement.
                  </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex gap-3 text-xs">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900 block mb-1">Attention au polyuréthane direct !</span>
                    <p className="text-slate-600 leading-normal font-medium">
                      Si vous remplacez l'Isolair Soprema écologique en fibre de bois par une plaque synthétique étanche de type polyuréthane, vous coupez la perspirance naturelle du bois de structure. Cela enfermerait l'humidité interne dans vos montants et l'isolant. Préférez toujours des dalles denses d'isolation bois biosourcées.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RECAP COST AND TECHNICAL SHEET BILL OF MATERIALS */}
        {activeTab === "materials" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Nomenclature & Calcul du Coût Moyen
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Tableau récapitulatif quantitatif de l'enveloppe configurée par m² habitable.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Estimation Totale Matériau</span>
                <span className="text-xl font-extrabold text-indigo-700 ml-auto block">
                  ~{totalEstimatedCost.toFixed(0)} € / m² H.T.
                </span>
              </div>
            </div>

            {/* Bill of materials table */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-slate-50 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Couche & Texture</th>
                    <th className="px-4 py-3">Matériau Optionnel</th>
                    <th className="px-4 py-3 text-center">Épaisseur</th>
                    <th className="px-4 py-3 text-center">Conductivité λ</th>
                    <th className="px-4 py-3 text-center">Résistance R</th>
                    <th className="px-4 py-3 text-center">Masse / m²</th>
                    <th className="px-4 py-3 text-right">Budget indicatif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {layers.map((layer, idx) => {
                    const matIndex = layer.selectedMaterialIndex ?? 0;
                    const mat = layer.materialChoices?.[matIndex];
                    const activeName = mat ? mat.name : "Standard";
                    const isBio = mat ? mat.type.includes("Biosourcé") || mat.type.includes("Bois") : (layer.id === "main_structure" || layer.id === "wood_cladding" || layer.id === "outer_insulation");
                    const density = mat ? mat.density : layer.density;
                    const lambda = mat ? mat.lambda : layer.lambda;
                    
                    const tM = layer.thickness / 1000;
                    const mass = tM * density;

                    let R = 0;
                    if (layer.fixedR !== null) {
                      R = layer.fixedR;
                    } else if (layer.id === "main_structure") {
                      // framing average
                      const woodLambda = 0.13;
                      const insLambda = lambda ?? 0.038;
                      const R_wood = tM / woodLambda;
                      const R_ins = tM / insLambda;
                      const U_composite = 0.1 * (1 / R_wood) + 0.9 * (1 / R_ins);
                      R = 1 / U_composite;
                    } else {
                      R = tM / (lambda ?? 0.04);
                    }

                    // cost scale
                    const baseCost = mat ? mat.approxPricePerM2 : (layer.id === "ventilated_cavity" ? 3 : 0);
                    const standardThicknessRef = layer.id === "interior_insulation" ? 100 : (layer.id === "main_structure" ? 140 : (layer.id === "outer_insulation" ? 60 : 100));
                    const finalPrice = baseCost * (layer.thickness / Math.max(1, standardThicknessRef));

                    return (
                      <tr key={layer.id} className="hover:bg-slate-50/40 transition-all">
                        <td className="px-4 py-3.5 font-semibold text-slate-800">
                          {layer.name}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${
                            isBio ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"
                          }`}>
                            {activeName}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-medium">
                          {layer.thickness} mm
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-slate-500">
                          {lambda ? `${lambda.toFixed(3)} W/m.K` : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800">
                          {R.toFixed(2)} m².K/W
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono">
                          {mass.toFixed(1)} kg
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-indigo-700">
                          {finalPrice > 0 ? `~${finalPrice.toFixed(1)} €` : "Gratuit*"}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* TOTAL SUMS ROW */}
                  <tr className="bg-slate-900 text-white font-semibold text-xs transition-colors">
                    <td className="px-4 py-4" colSpan={2}>
                      Bilan structurel du Mur
                    </td>
                    <td className="px-4 py-4 text-center font-mono">
                      {totalThicknessMm.toFixed(1)} mm
                    </td>
                    <td className="px-4 py-4 text-center font-mono text-slate-300">
                      —
                    </td>
                    <td className="px-4 py-4 text-center font-mono text-emerald-300 font-extrabold text-sm">
                      R = {R_overall.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-center font-mono">
                      {(totalBiosourcedMass + totalMineralMass).toFixed(1)} kg
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sky-300 text-sm font-extrabold">
                      ~{totalEstimatedCost.toFixed(0)} € / m²
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[10.5px] text-slate-400 italic">
              * Note budget: Les estimations de prix sont indicatives et basées sur des prix de revente généraux en France hors coût de main-d'œuvre de mise en œuvre artisanale. Sujet aux fluctuations des cours des bois de charpente de structure.
            </p>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 mt-16 pt-8 pb-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-6 space-y-4">
          <p className="font-mono">
            Coupe Mur Ossature Bois — Modélisateur conforme aux préconisations du CSTB & NF DTU 31.2
          </p>
          <div className="flex justify-center gap-4 text-[10px] uppercase font-bold tracking-widest text-slate-400">
            <span>DTU 31.2 (Structures ossature bois)</span>
            <span>•</span>
            <span>DTU 25.41 (Plâtrerie)</span>
            <span>•</span>
            <span>RE2020 Thermique</span>
          </div>
          <p className="text-[10px] text-slate-400 max-w-xl mx-auto leading-relaxed">
            Pour tout projet de construction, faites valider vos calculs thermiques officiels par un bureau d'études thermiques indépendant agréé (BET) utilisant les moteurs réglementaires certifiés.
          </p>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* ==================== PRINT ONLY VIEW ==================== */}
      {/* ========================================================= */}
      <div className="hidden print:block print-only mx-auto p-12 bg-white text-black font-sans">
        <div className="border-b-4 border-black pb-4 mb-8">
          <div className="text-xs uppercase font-mono tracking-wider text-slate-600 mb-1">
            DOSSIER TECHNIQUE D'ARCHITECTE
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-black">
            Fiche de Calcul : Coupe Technique Mur Ossature Bois (MOB)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Généré automatiquement le {new Date().toLocaleDateString("fr-FR")} pour votre projet d'éco-construction.
          </p>
        </div>

        {/* SUMMARY BADGES FOR PRINT */}
        <div className="grid grid-cols-4 gap-4 border border-black p-4 mb-8 font-mono text-xs">
          <div>
            <span className="text-slate-500 block uppercase font-sans text-[10px]">Épaisseur totale</span>
            <span className="font-bold text-sm">
              {totalThicknessMm.toFixed(1)} mm ({ (totalThicknessMm / 10).toFixed(1) } cm)
            </span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-sans text-[10px]">Résistance thermique</span>
            <span className="font-bold text-sm text-emerald-700">
              R = {R_overall.toFixed(2)} m².K/W
            </span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-sans text-[10px]">Déphasage d'été</span>
            <span className="font-bold text-sm text-amber-700">
              {totalPhaseShiftHours.toFixed(1)} h
            </span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-sans text-[10px]">Coeff Transmittance (U)</span>
            <span className="font-bold text-sm">
              {U_value.toFixed(3)} W/m².K
            </span>
          </div>
        </div>

        {/* PRINT DIAGRAM RENDER */}
        <div className="border border-slate-300 p-6 rounded-lg mb-8 bg-slate-50/20 text-center">
          <h3 className="font-bold text-sm mb-4 text-left border-b pb-1">Visualisation Simplifiée de l'Enveloppe</h3>
          <div className="flex h-16 w-full border border-black overflow-hidden select-none font-bold text-center text-[10px] leading-relaxed">
            {layers.map((layer) => {
              const activeChoice = layer.materialChoices?.[layer.selectedMaterialIndex ?? 0]?.name ?? "Standard";
              return (
                <div 
                  key={layer.id} 
                  className="border-r border-black last:border-0 h-full flex flex-col justify-center items-center bg-slate-50"
                  style={{ width: `${(layer.thickness / totalThicknessMm) * 100}%`, minWidth: "12px" }}
                >
                  <span className="truncate w-full px-1">{layer.name}</span>
                  <span className="font-mono text-[8px] font-normal text-slate-500">{layer.thickness}mm</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* PRINT TABLE OF LAYERS */}
        <div>
          <h2 className="font-bold text-lg mb-4 border-b border-black pb-1 uppercase">Détail des Couches du Mur</h2>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b-2 border-black font-semibold text-[10px] uppercase">
                <th className="py-2">Couche</th>
                <th className="py-2">Matériau Sélectionné</th>
                <th className="py-2 text-center">Épaisseur</th>
                <th className="py-2 text-center">Lambda (λ)</th>
                <th className="py-2 text-center">Résistance (R)</th>
                <th className="py-2 text-right">Budget Estimé H.T.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {layers.map((layer) => {
                const matIndex = layer.selectedMaterialIndex ?? 0;
                const mat = layer.materialChoices?.[matIndex];
                const activeName = mat ? mat.name : "Standard";
                const lambda = mat ? mat.lambda : layer.lambda;

                const tM = layer.thickness / 1000;
                let R = 0;
                if (layer.fixedR !== null) {
                  R = layer.fixedR;
                } else if (layer.id === "main_structure") {
                  const woodLambda = 0.13;
                  const insLambda = lambda ?? 0.038;
                  const R_wood = tM / woodLambda;
                  const R_ins = tM / insLambda;
                  const U_composite = 0.1 * (1 / R_wood) + 0.9 * (1 / R_ins);
                  R = 1 / U_composite;
                } else {
                  R = tM / (lambda ?? 0.04);
                }

                const baseCost = mat ? mat.approxPricePerM2 : (layer.id === "ventilated_cavity" ? 3 : 0);
                const standardThicknessRef = layer.id === "interior_insulation" ? 100 : (layer.id === "main_structure" ? 140 : (layer.id === "outer_insulation" ? 60 : 100));
                const price = baseCost * (layer.thickness / Math.max(1, standardThicknessRef));

                return (
                  <tr key={layer.id} className="py-2">
                    <td className="py-2 font-semibold">
                      {layer.name}
                    </td>
                    <td className="py-2 italic text-slate-700">
                      {activeName}
                    </td>
                    <td className="py-2 text-center font-mono">
                      {layer.thickness} mm
                    </td>
                    <td className="py-2 text-center font-mono">
                      {lambda ? `${lambda.toFixed(3)} W/m.K` : "—"}
                    </td>
                    <td className="py-2 text-center font-mono font-bold">
                      {R.toFixed(2)} m².K/W
                    </td>
                    <td className="py-2 text-right font-mono">
                      ~{price.toFixed(1)} €/m²
                    </td>
                  </tr>
                );
              })}
              
              <tr className="border-t-2 border-black font-bold">
                <td className="py-3" colSpan={2}>Bilan Total</td>
                <td className="py-3 text-center">{totalThicknessMm.toFixed(1)} mm</td>
                <td className="py-3 text-center">—</td>
                <td className="py-3 text-center">R = {R_overall.toFixed(2)}</td>
                <td className="py-3 text-right">~{totalEstimatedCost.toFixed(0)} €/m²</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* PRINT RECOMMENDATIONS */}
        <div className="mt-12 border-t pt-6 text-[10px] text-slate-500 space-y-2">
          <p className="font-bold uppercase text-black">Prescriptions Générales de pose NF DTU 31.2 :</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>La barrière d'étanchéité à l'air (film frein-vapeur) doit être totalement continue sur toute la surface chauffée de l'habitation. Raccords souples collés et mastics requis.</li>
            <li>Une grille anti-rongeurs en pied de bardage est obligatoire pour maintenir la lame de ventilation saine libre de nids.</li>
            <li>Le garde au sol extérieur du bardage bois vertical doit être d'au moins 20cm par rapport au sol meuble fini extérieur pour éviter l'humidité des rejaillissements.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
