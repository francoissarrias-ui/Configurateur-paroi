/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { WallLayer } from "../types";
import { HelpCircle, Info, Thermometer, Layers, RefreshCw } from "lucide-react";

interface WallCrossSectionProps {
  layers: WallLayer[];
  selectedLayerId: string;
  onSelectLayer: (layerId: string) => void;
  scaleMode: "real" | "readable";
  setScaleMode: (mode: "real" | "readable") => void;
  indoorTemp: number;
  outdoorTemp: number;
  showGradient: boolean;
  setShowGradient: (show: boolean) => void;
}

export default function WallCrossSection({
  layers,
  selectedLayerId,
  onSelectLayer,
  scaleMode,
  setScaleMode,
  indoorTemp,
  outdoorTemp,
  showGradient,
  setShowGradient,
}: WallCrossSectionProps) {
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);

  // Surface resistances according to standard EN ISO 6946 (Th-U rules in France)
  const R_si = 0.13; // interior surface resistance
  const R_se = 0.04; // exterior surface resistance

  // Calculate resistances for each layer
  const layerCalculativeR = layers.map((layer) => {
    if (layer.fixedR !== null) {
      return layer.fixedR;
    }
    // For main structure, compute effective R assuming 10% wood framing factor and 90% insulation
    if (layer.id === "main_structure") {
      const woodLambda = 0.13; // pine/spruce
      const insLambda = layer.lambda ?? 0.038;
      const tM = layer.thickness / 1000; // in meters
      const R_wood = tM / woodLambda;
      const R_ins = tM / insLambda;
      // Parallel resistances model
      const U_composite = 0.1 * (1 / R_wood) + 0.9 * (1 / R_ins);
      return 1 / U_composite;
    }
    const tM = layer.thickness / 1000;
    const lam = layer.lambda ?? 0.04;
    return tM / lam;
  });

  const R_total = layerCalculativeR.reduce((sum, curr) => sum + curr, 0);
  const R_overall = R_si + R_total + R_se;

  // Let's compute temperature gradient coordinates
  // Width of the SVG canvas is 800, height is 340
  const svgWidth = 800;
  const svgHeight = 340;
  const paddingLeft = 50;
  const paddingRight = 50;
  const drawWidth = svgWidth - paddingLeft - paddingRight;

  // Get visual widths of each layer
  let totalThickness = layers.reduce((sum, l) => sum + l.thickness, 0);
  
  let layerVisualWidths: number[] = [];
  if (scaleMode === "real") {
    // Proportional to physical thickness, but with a minimum of 4.5px for thin membranes so they remain clear and hoverable
    const minMembraneWidth = 5.5;
    let rawWidths = layers.map((l) => (l.thickness / totalThickness) * drawWidth);
    
    // Distribute a tiny bit of width to membranes to make them clickable
    let totalAssigned = 0;
    rawWidths.forEach((w) => { totalAssigned += w; });
    
    let excessNeeded = 0;
    const adjustedRaw = rawWidths.map((w, idx) => {
      const layer = layers[idx];
      if ((layer.id === "vapour_barrier" || layer.id === "rain_barrier") && w < minMembraneWidth) {
        excessNeeded += (minMembraneWidth - w);
        return minMembraneWidth;
      }
      return w;
    });

    const standardLayersTotalWidth = rawWidths.reduce((sum, w, idx) => {
      const layer = layers[idx];
      return (layer.id !== "vapour_barrier" && layer.id !== "rain_barrier") ? sum + w : sum;
    }, 0);

    layerVisualWidths = adjustedRaw.map((w, idx) => {
      const layer = layers[idx];
      if (layer.id === "vapour_barrier" || layer.id === "rain_barrier") {
        return w;
      }
      // Subtract excess proportionally from non-membrane layers
      const ratio = w / standardLayersTotalWidth;
      return Math.max(10, w - excessNeeded * ratio);
    });
  } else {
    // Readable mode (min visual thickness applied)
    // We give a minimum thickness weight, e.g. vapor barrier is thin but visible, others are wider
    const rawWeights = layers.map((l) => {
      if (l.id === "vapour_barrier" || l.id === "rain_barrier") return 8; // small membranes visible
      if (l.id === "plasterboard") return 20;
      if (l.id === "ventilated_cavity") return 35;
      return Math.sqrt(l.thickness) * 10; // compressed non-linear scale for readability
    });
    const totalWeight = rawWeights.reduce((sum, w) => sum + w, 0);
    layerVisualWidths = rawWeights.map((w) => (w / totalWeight) * drawWidth);
  }

  // Calculate cumulative X offsets
  const layerXPositions: number[] = [];
  let currentX = paddingLeft;
  for (let i = 0; i < layers.length; i++) {
    layerXPositions.push(currentX);
    currentX += layerVisualWidths[i];
  }

  // Temperature gradient values at each boundary
  const borderTemps: number[] = [];
  // 1. Inside Air
  borderTemps.push(indoorTemp);
  
  // 2. Interior Surface (after R_si drop)
  let currentTemp = indoorTemp - ((indoorTemp - outdoorTemp) * R_si) / R_overall;
  borderTemps.push(currentTemp);

  // 3. Between each layer
  let accumulatedR = 0;
  for (let i = 0; i < layers.length; i++) {
    accumulatedR += layerCalculativeR[i];
    const tempDrop = ((indoorTemp - outdoorTemp) * (R_si + accumulatedR)) / R_overall;
    currentTemp = indoorTemp - tempDrop;
    borderTemps.push(currentTemp);
  }

  // Map temperatures to Y coordinates (e.g., Temp range from -10 to 30)
  // Let's dynamically fit the temperature range or keep it static
  const tempMin = Math.min(-10, outdoorTemp - 5);
  const tempMax = Math.max(35, indoorTemp + 5);
  const getTempY = (temp: number) => {
    const ratio = (temp - tempMin) / (tempMax - tempMin);
    // Y runs from height - 40 (bottom) to 40 (top)
    return svgHeight - 40 - ratio * (svgHeight - 80);
  };

  // Generate temperature gradient path points
  const points: { x: number; y: number; temp: number }[] = [];
  // Inside Air point (factive offset further left)
  points.push({ x: paddingLeft - 25, y: getTempY(indoorTemp), temp: indoorTemp });
  // Surface interior
  points.push({ x: paddingLeft, y: getTempY(borderTemps[1]), temp: borderTemps[1] });
  // Layer boundaries
  for (let i = 0; i < layers.length; i++) {
    const endX = layerXPositions[i] + layerVisualWidths[i];
    points.push({ x: endX, y: getTempY(borderTemps[i + 2]), temp: borderTemps[i + 2] });
  }
  // Outside Air point (factive offset further right)
  points.push({ x: svgWidth - paddingRight + 25, y: getTempY(outdoorTemp), temp: outdoorTemp });

  const gradientPathD = points.reduce((path, p, index) => {
    return path + (index === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
  }, "");

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Coupe Technique Interactive (Intérieur → Extérieur)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Survolez ou cliquez sur une couche pour l'analyser en détail
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center text-xs">
            <button
              onClick={() => setScaleMode("readable")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                scaleMode === "readable"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Affiche toutes les couches de façon visible, même les membranes très fines"
            >
              Échelle optimisée
            </button>
            <button
              onClick={() => setScaleMode("real")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                scaleMode === "real"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Affiche l'épaisseur réelle relative de chaque élément"
            >
              Échelle réelle
            </button>
          </div>

          <button
            onClick={() => setShowGradient(!showGradient)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
              showGradient
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Thermometer className="w-4 h-4" />
            {showGradient ? "Masquer Température" : "Courbe Thermique"}
          </button>
        </div>
      </div>

      {/* Main CAD Visual Canvas Area */}
      <div className="relative border border-slate-100 bg-slate-50/50 rounded-xl overflow-hidden mb-4 p-2 select-none">
        {/* Inside/Outside absolute labels */}
        <div className="absolute top-3 left-4 text-[10px] font-bold text-indigo-600 tracking-wider uppercase bg-white/80 px-2 py-0.5 rounded-full border border-indigo-100/50 backdrop-blur-xs">
          INTÉRIEUR (Chaud)
        </div>
        <div className="absolute top-3 right-4 text-[10px] font-bold text-amber-700 tracking-wider uppercase bg-white/80 px-2 py-0.5 rounded-full border border-amber-100/50 backdrop-blur-xs">
          EXTÉRIEUR (Froid)
        </div>

        {/* Temperature Indicators */}
        {showGradient && (
          <>
            <div className="absolute bottom-3 left-4 text-xs font-semibold text-slate-700 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block animate-pulse"></span>
              {indoorTemp}°C int.
            </div>
            <div className="absolute bottom-3 right-4 text-xs font-semibold text-slate-700 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
              {outdoorTemp}°C ext.
            </div>
          </>
        )}

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-[360px]"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* DEFINITIONS OF TEXTURES & PATTERNS */}
          <defs>
            {/* Fine Professional CAD Drafting Grid */}
            <pattern id="cad-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="20" y2="0" stroke="#f1f5f9" strokeWidth="0.8" />
              <line x1="0" y1="0" x2="0" y2="20" stroke="#f1f5f9" strokeWidth="0.8" />
              <path d="M 0,0 L 2,0 M 0,0 L 0,2" stroke="#e2e8f0" strokeWidth="0.6" />
            </pattern>

            {/* Standard CAD insulation scroll pattern (repeating wave coils) */}
            <pattern id="cad-insulation-scroll" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 0,10 C 5,0 5,20 10,10 C 15,0 15,20 20,10"
                fill="none"
                stroke="#eab308"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.55"
              />
              <path
                d="M 0,-10 C 5,-20 5,0 10,-10 C 15,-20 15,0 20,-10"
                fill="none"
                stroke="#eab308"
                strokeWidth="0.8"
                strokeLinecap="round"
                opacity="0.25"
              />
              <path
                d="M 0,30 C 5,20 5,40 10,30 C 15,20 15,40 20,30"
                fill="none"
                stroke="#eab308"
                strokeWidth="0.8"
                strokeLinecap="round"
                opacity="0.25"
              />
            </pattern>

            {/* Plasterboard stippled grain (Gypsum core) */}
            <pattern id="cad-plaster" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.5" fill="#94a3b8" opacity="0.8" />
              <circle cx="6" cy="4" r="0.4" fill="#94a3b8" opacity="0.5" />
              <circle cx="3" cy="6" r="0.5" fill="#475569" opacity="0.6" />
            </pattern>

            {/* Wood fiber hardboard dense cross-hatch (Soprema Isolair) */}
            <pattern id="cad-isolair" width="12" height="12" patternUnits="userSpaceOnUse">
              <line x1="0" y1="12" x2="12" y2="0" stroke="#ca8a04" strokeWidth="0.7" opacity="0.25" />
              <line x1="1.5" y1="12" x2="12" y2="1.5" stroke="#ca8a04" strokeWidth="0.5" opacity="0.15" />
              <line x1="0" y1="10.5" x2="10.5" y2="0" stroke="#ca8a04" strokeWidth="0.5" opacity="0.15" />
            </pattern>

            {/* Premium organic wood grain with knots */}
            <pattern id="cad-wood-grain" width="40" height="120" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="40" height="120" fill="#fefaf0" />
              <path
                d="M 5,0 Q 15,30 5,60 T 5,120 M 20,0 Q 10,40 25,80 T 15,120 M 35,0 Q 25,20 38,50 T 32,120"
                fill="none"
                stroke="#b45309"
                strokeWidth="0.45"
                opacity="0.12"
              />
            </pattern>
          </defs>

          {/* BLUEPRINT BACKDROP GRID */}
          <rect
            x={paddingLeft - 30}
            y={10}
            width={drawWidth + 60}
            height={svgHeight - 20}
            fill="url(#cad-grid)"
            stroke="#e2e8f0"
            strokeWidth="1"
            rx="4"
          />

          {/* RENDERING THE WALL LAYERS */}
          {layers.map((layer, index) => {
            const x = layerXPositions[index];
            const w = layerVisualWidths[index];
            const y = 50; // top ceiling margin
            const h = svgHeight - 110; // height of the drawing zone

            const isSelected = selectedLayerId === layer.id;
            const isHovered = hoveredLayerId === layer.id;

            // Resolve background fill depending on the pattern style
            let fillValue = layer.color;
            if (layer.patternType === "fiber" || layer.patternType === "studs") {
              fillValue = "url(#cad-insulation-scroll)";
            } else if (layer.patternType === "wood-vertical") {
              fillValue = "url(#cad-wood-grain)";
            } else if (layer.patternType === "air") {
              fillValue = "url(#cad-grid)";
            } else if (layer.patternType === "dots" || layer.id === "plasterboard") {
              fillValue = "url(#cad-plaster)";
            } else if (layer.id === "outer_insulation") {
              fillValue = "url(#cad-isolair)";
            }

            return (
              <g
                key={layer.id}
                className="cursor-pointer transition-all duration-200"
                onClick={() => onSelectLayer(layer.id)}
                onMouseEnter={() => setHoveredLayerId(layer.id)}
                onMouseLeave={() => setHoveredLayerId(null)}
              >
                {/* Visual solid card basis to hold color context */}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={layer.patternType === "membrane" ? "#fafafa" : layer.color}
                  opacity={layer.patternType === "membrane" ? 0.3 : 0.08}
                />

                {/* Main Hatch Pattern layer Box */}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={fillValue}
                  stroke={isSelected ? "#4f46e5" : isHovered ? "#3b82f6" : "#cbd5e1"}
                  strokeWidth={isSelected ? 1.8 : isHovered ? 1.2 : 0.5}
                  className="transition-all duration-150"
                />

                {/* INTERACTIVE CAD OVERLAYS & GRAPHIC DETAILS */}

                {/* 1. Finition Plâtre: Gypsum dots + double paper liners */}
                {layer.id === "plasterboard" && (
                  <g pointerEvents="none">
                    <line x1={x + w} y1={y} x2={x + w} y2={y + h} stroke="#475569" strokeWidth="0.8" />
                    <line x1={x + w - 1.5} y1={y} x2={x + w - 1.5} y2={y + h} stroke="#94a3b8" strokeWidth="0.4" />
                  </g>
                )}

                {/* 2. Vide Technique: C-Stud brackets representing metal framework profile */}
                {layer.id === "service_gap" && (
                  <g opacity="0.65" pointerEvents="none">
                    {[25, 75, 125, 175, 215].map((offsetY) => (
                      <path
                        key={offsetY}
                        d={`M ${x + 6} ${y + offsetY} h ${w - 12} v 6 h -${w - 12} Z`}
                        fill="#cbd5e1"
                        stroke="#475569"
                        strokeWidth="0.7"
                      />
                    ))}
                    {/* Metal bracket screw lines */}
                    <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="6 8" />
                  </g>
                )}

                {/* 3. Frein Vapeur Membrane: Continuous blueprint Blue screen label line */}
                {layer.id === "vapour_barrier" && (
                  <g pointerEvents="none">
                    <line
                      x1={x + w / 2}
                      y1={y}
                      x2={x + w / 2}
                      y2={y + h}
                      stroke="#2563eb"
                      strokeWidth="3.2"
                      strokeDasharray="14 6"
                      className="animate-pulse"
                      style={{ animationDuration: "4s" }}
                    />
                    {/* Continuous ribbon tags */}
                    <line
                      x1={x + w / 2}
                      y1={y}
                      x2={x + w / 2}
                      y2={y + h}
                      stroke="#ffffff"
                      strokeWidth="0.8"
                      strokeDasharray="2 18"
                    />
                    <text
                      x={x + w / 2}
                      y={y + h / 2 - 20}
                      transform={`rotate(-90, ${x + w / 2}, ${y + h / 2 - 20})`}
                      textAnchor="middle"
                      className="fill-blue-800 text-[6.5px] font-mono font-bold tracking-widest"
                      opacity="0.8"
                    >
                      FREIN-VAPEUR Sd HYGRO
                    </text>
                  </g>
                )}

                {/* 4. Core wood frame structural studs cuts with wood fibers and structural cross lines */}
                {layer.id === "main_structure" && (
                  <g pointerEvents="none">
                    {/* Left structural Timber stud cut */}
                    <g>
                      <rect
                        x={x}
                        y={y}
                        width={Math.min(w, 22)}
                        height={h}
                        fill="#fefcf6"
                        stroke="#78350f"
                        strokeWidth="1"
                      />
                      <line x1={x} y1={y} x2={x + Math.min(w, 22)} y2={y + h} stroke="#b45309" strokeWidth="0.6" opacity="0.6" />
                      <line x1={x + Math.min(w, 22)} y1={y} x2={x} y2={y + h} stroke="#b45309" strokeWidth="0.6" opacity="0.6" />
                      <path d={`M ${x + 2} ${y + 50} q 8 20 0 40`} fill="none" stroke="#d97706" strokeWidth="0.3" opacity="0.3" />
                      <path d={`M ${x + 2} ${y + 150} q 10 30 0 60`} fill="none" stroke="#d97706" strokeWidth="0.3" opacity="0.3" />
                    </g>
                    {/* Right structural Timber stud cut */}
                    {w > 65 && (
                      <g>
                        <rect
                          x={x + w - 22}
                          y={y}
                          width={22}
                          height={h}
                          fill="#fefcf6"
                          stroke="#78350f"
                          strokeWidth="1"
                        />
                        <line x1={x + w - 22} y1={y} x2={x + w} y2={y + h} stroke="#b45309" strokeWidth="0.6" opacity="0.6" />
                        <line x1={x + w} y1={y} x2={x + w - 22} y2={y + h} stroke="#b45309" strokeWidth="0.6" opacity="0.6" />
                        <path d={`M ${x + w - 20} ${y + 80} q 8 20 0 40`} fill="none" stroke="#d97706" strokeWidth="0.3" opacity="0.3" />
                      </g>
                    )}
                  </g>
                )}

                {/* 5. Isolair Rigide Soprema : Wood fiber joints and horizontal siding cuts */}
                {layer.id === "outer_insulation" && (
                  <g opacity="0.7" pointerEvents="none">
                    {[40, 90, 140, 190].map((lineY) => (
                      <line
                        key={lineY}
                        x1={x}
                        y1={y + lineY}
                        x2={x + w}
                        y2={y + lineY}
                        stroke="#ca8a04"
                        strokeWidth="0.6"
                        strokeDasharray="2 2"
                      />
                    ))}
                  </g>
                )}

                {/* 6. ÉCRAN PARE-PLUIE HPV MEMBRANE wrapper on Isolair Soprema outside */}
                {layer.id === "rain_barrier" && (
                  <g pointerEvents="none">
                    <line
                      x1={x + w / 2}
                      y1={y}
                      x2={x + w / 2}
                      y2={y + h}
                      stroke="#0284c7"
                      strokeWidth="3.2"
                      strokeDasharray="14 4 2 4"
                      className="animate-pulse"
                      style={{ animationDuration: "3s" }}
                    />
                    {/* Tiny text printed on film */}
                    <text
                      x={x + w / 2}
                      y={y + h / 2 + 10}
                      transform={`rotate(-90, ${x + w / 2}, ${y + h / 2 + 10})`}
                      textAnchor="middle"
                      className="fill-sky-800 text-[6px] font-mono font-bold tracking-widest"
                      opacity="0.95"
                    >
                      ÉCRAN PARE-PLUIE HPV SOPREMA --
                    </text>
                  </g>
                )}

                {/* 7. Lame d'Air Ventilée (Tasseaux + Grille): Upward draft arrows & wood battens blocks */}
                {layer.id === "ventilated_cavity" && (
                  <g pointerEvents="none">
                    {/* Blue dynamic air flow draft arrows pointing up */}
                    {[50, 110, 170].map((arrowY) => (
                      <path
                        key={arrowY}
                        d={`M ${x + w / 2} ${y + arrowY + 12} L ${x + w / 2} ${y + arrowY - 12} M ${x + w / 2 - 4} ${y + arrowY - 6} L ${x + w / 2} ${y + arrowY - 12} L ${x + w / 2 + 4} ${y + arrowY - 6}`}
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-pulse"
                        style={{ animationDuration: "2s" }}
                      />
                    ))}
                    {/* Crossed Horizontal Section Battens (Tasseaux de ventilation) */}
                    {[15, 85, 145, 205].map((battenY) => (
                      <g key={battenY} transform={`translate(${x + 1}, ${y + battenY})`}>
                        <rect width={w - 2} height="12" fill="#fffdf6" stroke="#78350f" strokeWidth="0.75" />
                        <line x1="0" y1="0" x2={w - 2} y2="12" stroke="#78350f" strokeWidth="0.4" opacity="0.4" />
                        <line x1={w - 2} y1="0" x2="0" y2="12" stroke="#78350f" strokeWidth="0.4" opacity="0.4" />
                      </g>
                    ))}
                  </g>
                )}

                {/* 8. Bardage Bois: Authentic tongue-and-groove boards cuts */}
                {layer.id === "wood_cladding" && (
                  <g pointerEvents="none">
                    {Array.from({ length: Math.ceil(w / 18) }).map((_, boardIdx) => {
                      const boardX = x + boardIdx * 18;
                      const boardW = Math.min(18, x + w - boardX);
                      if (boardW < 3) return null;
                      return (
                        <g key={boardIdx}>
                          {/* Main board rectangle */}
                          <rect
                            x={boardX}
                            y={y}
                            width={boardW}
                            height={h}
                            fill="url(#cad-wood-grain)"
                            stroke="#78350f"
                            strokeWidth="0.8"
                          />
                          {/* Profile overlapping lines (profil clin ou emboitement languette) */}
                          <line
                            x1={boardX + boardW - 2.5}
                            y1={y}
                            x2={boardX + boardW - 2.5}
                            y2={y + h}
                            stroke="#b45309"
                            strokeWidth="0.6"
                            opacity="0.7"
                          />
                          {/* Diagonal chamfers / chamfreins de finition */}
                          <path
                            d={`M ${boardX + boardW - 2.5} ${y + 15} l 2.5 4 M ${boardX + boardW - 2.5} ${y + 115} l 2.5 4`}
                            stroke="#78350f"
                            strokeWidth="0.55"
                          />
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* Double outline boundary highlighting box when selected */}
                {isSelected && (
                  <rect
                    x={x}
                    y={y - 8}
                    width={w}
                    height={h + 16}
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    rx={2.5}
                  />
                )}

                {/* Dynamic dimensional extension lines (attachment lines) directed to upper ruler */}
                <line
                  x1={x}
                  y1={y}
                  x2={x}
                  y2={22}
                  stroke={isSelected ? "#4f46e5" : "#94a3b8"}
                  strokeWidth={isSelected ? "1" : "0.5"}
                  strokeDasharray="2 3"
                  pointerEvents="none"
                />
                
                {/* 45 Degree slash technical tick on top scale dimensions chain */}
                <g pointerEvents="none">
                  {/* Slash cut at scale intersection */}
                  <line
                    x1={x - 4}
                    y1={29}
                    x2={x + 4}
                    y2={21}
                    stroke={isSelected ? "#4f46e5" : "#475569"}
                    strokeWidth={isSelected ? 2 : 1.25}
                  />
                  {/* Extension line for end boundary */}
                  {index === layers.length - 1 && (
                    <line
                      x1={x + w}
                      y1={y}
                      x2={x + w}
                      y2={22}
                      stroke="#94a3b8"
                      strokeWidth="0.5"
                      strokeDasharray="2 3"
                    />
                  )}
                  {index === layers.length - 1 && (
                    <line
                      x1={x + w - 4}
                      y1={29}
                      x2={x + w + 4}
                      y2={21}
                      stroke="#475569"
                      strokeWidth="1.25"
                    />
                  )}
                </g>

                {/* Dimensional metric text formatted exactly above dimension chain horizontal ruler line */}
                <text
                  x={x + w / 2}
                  y={16}
                  textAnchor="middle"
                  className={`text-[9.5px] font-mono font-bold select-none ${
                    isSelected ? "fill-indigo-700 font-extrabold scale-105" : isHovered ? "fill-blue-600" : "fill-slate-600"
                  }`}
                  pointerEvents="none"
                >
                  {layer.thickness} mm
                </text>

                {/* Tooltip anchor when hovered */}
                {isHovered && (
                  <g transform={`translate(${x + w / 2}, ${y + h / 2})`} pointerEvents="none" className="z-50">
                    <rect
                      x="-110"
                      y="-48"
                      width="220"
                      height="42"
                      fill="#0f172a"
                      rx="6"
                      className="shadow-xl"
                    />
                    <polygon points="0,0 -6,-6 6,-6" fill="#0f172a" />
                    <text
                      y="-32"
                      textAnchor="middle"
                      fill="#f8fafc"
                      className="text-[10px] font-semibold"
                    >
                      {layer.name.length > 34 ? layer.name.substring(0, 31) + "..." : layer.name}
                    </text>
                    <text y="-16" textAnchor="middle" fill="#38bdf8" className="text-[8px] font-mono font-bold">
                      {layer.thickness} mm | R = {layerCalculativeR[index].toFixed(2)} m².K/W
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* TOP HORIZONTAL TECHNICAL DIMENSION LINE (Cotations) */}
          <line
            x1={paddingLeft}
            y1={25}
            x2={svgWidth - paddingRight}
            y2={25}
            stroke="#475569"
            strokeWidth="1"
            pointerEvents="none"
          />

          {/* TEMPERATURE GRADIENT DRAWING OVERLAY */}
          {showGradient && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <defs>
                <linearGradient id="heat-flow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.05" />
                  <stop offset="50%" stopColor="#ef4444" stopOpacity="0.01" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              {/* Thermal drift shadow shading background */}
              <rect
                x={paddingLeft}
                y={50}
                width={drawWidth}
                height={svgHeight - 110}
                fill="url(#heat-flow)"
                pointerEvents="none"
              />

              {/* Zero degrees Celsius dashed reference line */}
              {tempMin < 0 && tempMax > 0 && (
                <g opacity="0.3">
                  <line
                    x1={paddingLeft - 30}
                    y1={getTempY(0)}
                    x2={svgWidth - paddingRight + 30}
                    y2={getTempY(0)}
                    stroke="#2563eb"
                    strokeWidth="0.8"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingLeft - 35}
                    y={getTempY(0) + 3}
                    className="text-[8px] font-bold fill-sky-600 font-mono"
                    textAnchor="end"
                  >
                    0°C
                  </text>
                </g>
              )}

              {/* Gradient Temperature line path */}
              <path
                d={gradientPathD}
                fill="none"
                stroke="#dc2626"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                pointerEvents="none"
                className="drop-shadow-[0_1.5px_3.5px_rgba(220,38,38,0.45)]"
              />

              {/* Individual vertex nodes detailing temperature at boundaries */}
              {points.map((p, idx) => {
                const nodeColor = p.temp > 15 ? "#dc2626" : p.temp > 5 ? "#eab308" : p.temp > 0 ? "#2563eb" : "#0284c7";

                return (
                  <g key={`node-${idx}`} className="pointer-events-none">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill="#ffffff"
                      stroke={nodeColor}
                      strokeWidth="2"
                    />
                    {/* Temperature value string node annotation */}
                    <text
                      x={p.x}
                      y={p.y - 8}
                      textAnchor="middle"
                      className="text-[8.5px] font-mono font-bold fill-slate-800 bg-white"
                    >
                      {p.temp.toFixed(1)}°C
                    </text>
                  </g>
                );
              })}
            </motion.g>
          )}

          {/* CEILING & FLOOR STRUCTURAL INDICATORS (CAD Blueprints aesthetic) */}
          <line
            x1={paddingLeft - 20}
            y1={50}
            x2={svgWidth - paddingRight + 20}
            y2={50}
            stroke="#64748b"
            strokeWidth="1.2"
            strokeDasharray="5 3"
          />
          <line
            x1={paddingLeft - 20}
            y1={svgHeight - 60}
            x2={svgWidth - paddingRight + 20}
            y2={svgHeight - 60}
            stroke="#64748b"
            strokeWidth="1.2"
            strokeDasharray="5 3"
          />
        </svg>

        {/* Legend / Info box in interactive CAD with double column */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-900 text-slate-100 px-4 py-3 mt-2 rounded-lg text-[9px] font-mono tracking-wide border border-slate-800 shadow-sm leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-yellow-400 opacity-60 border border-yellow-600/30 rounded-xs inline-block"></span>
            <span>Isolant fibreux souple</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber-500 opacity-60 border border-amber-600/30 rounded-xs inline-block"></span>
            <span>Raccords d'ossature bois</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 border-t-2 border-dashed border-blue-500 inline-block"></span>
            <span>Film barrière vapeur</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 border-t-2 border-dashed border-sky-400 inline-block"></span>
            <span>Écran pare-pluie HPV</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
            <span className="w-2.5 h-2.5 bg-emerald-600/50 border border-emerald-400/40 rounded-xs inline-block"></span>
            <span>Lame d'air / Tasseaux</span>
          </div>
        </div>
      </div>
    </div>
  );
}
