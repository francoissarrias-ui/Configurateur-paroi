/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { WallLayer, MaterialOption } from "../types";
import { 
  Sliders, 
  BookOpen, 
  Hammer, 
  HelpCircle, 
  Euro, 
  BadgeAlert,
  Sparkles,
  ChevronRight
} from "lucide-react";

interface ConfigPanelProps {
  layers: WallLayer[];
  selectedLayerId: string;
  onSelectLayer: (layerId: string) => void;
  onUpdateLayerThickness: (layerId: string, newThickness: number) => void;
  onUpdateLayerMaterial: (layerId: string, materialIndex: number) => void;
}

export default function ConfigPanel({
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayerThickness,
  onUpdateLayerMaterial
}: ConfigPanelProps) {
  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  if (!selectedLayer) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center text-slate-500">
        Sélectionnez une couche de mur pour l'analyser ou ajuster ses réglages.
      </div>
    );
  }

  const selectedMaterialIndex = selectedLayer.selectedMaterialIndex ?? 0;
  const activeMaterial = selectedLayer.materialChoices?.[selectedMaterialIndex];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden h-full">
      {/* Tab Header of Selected Layer */}
      <div className="p-5 border-b border-slate-50 bg-slate-50/50">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 tracking-wider uppercase mb-1">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>Configurateur de Couche</span>
        </div>
        <h3 className="text-lg font-bold text-slate-800 leading-tight">
          {selectedLayer.name}
        </h3>
        <p className="text-xs text-indigo-900/60 font-medium mt-0.5">
          Rôle : {selectedLayer.role}
        </p>
      </div>

      {/* Main Body */}
      <div className="p-6 overflow-y-auto space-y-6 flex-1 max-h-[560px]">
        {/* Layer Description */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Rôle et Fonction
          </span>
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100/50">
            {selectedLayer.description}
          </p>
        </div>

        {/* Thickness customizer slider if configurable */}
        {selectedLayer.isConfigurable && selectedLayer.minThickness && selectedLayer.maxThickness ? (
          <div className="space-y-3 bg-indigo-50/25 p-4 rounded-xl border border-indigo-50">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Épaisseur de la couche
              </label>
              <div className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {selectedLayer.thickness} mm ({ (selectedLayer.thickness / 10).toFixed(1) } cm)
              </div>
            </div>

            <input
              type="range"
              min={selectedLayer.minThickness}
              max={selectedLayer.maxThickness}
              step={selectedLayer.id === "vapour_barrier" ? 0.1 : 5}
              value={selectedLayer.thickness}
              onChange={(e) => onUpdateLayerThickness(selectedLayer.id, parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
            />
            
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Min: {selectedLayer.minThickness} mm</span>
              <span>Max: {selectedLayer.maxThickness} mm</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"></span>
            L'épaisseur de cette couche est standardisée ({selectedLayer.thickness} mm) et ne peut être modifiée pour des raisons d'avis technique (DTU).
          </div>
        )}

        {/* Material choice selection */}
        {selectedLayer.materialChoices && selectedLayer.materialChoices.length > 0 && (
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Choix du Matériau
            </span>
            <div className="space-y-2.5">
              {selectedLayer.materialChoices.map((choice, idx) => {
                const isActive = idx === selectedMaterialIndex;
                return (
                  <button
                    key={choice.name}
                    type="button"
                    onClick={() => onUpdateLayerMaterial(selectedLayer.id, idx)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-start relative ${
                      isActive
                        ? "bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-500 shadow-xs"
                        : "bg-white border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="font-semibold text-slate-800">{choice.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-xs font-medium uppercase font-mono ${
                        choice.carbonFootprint === "Excellent" 
                          ? "bg-emerald-100 text-emerald-800" 
                          : choice.carbonFootprint === "Bon" 
                          ? "bg-teal-100 text-teal-800" 
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        CO₂: {choice.carbonFootprint}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                      {choice.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-slate-400 font-mono pt-2 border-t border-dashed border-slate-100 w-full">
                      {choice.lambda && (
                        <span>λ: <strong className="text-slate-600">{choice.lambda.toFixed(3)}</strong> W/m.K</span>
                      )}
                      <span>ρ: <strong className="text-slate-600">{choice.density}</strong> kg/m³</span>
                      <span>c: <strong className="text-slate-600">{choice.specificHeat}</strong> J/kg</span>
                      <span className="text-indigo-600 flex items-center gap-px ml-auto font-sans font-bold">
                        ~{choice.approxPricePerM2}€/m²
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* DTU Pose Notes (Norme française) */}
        {selectedLayer.dtuNotes && (
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
              <Hammer className="w-4 h-4 text-amber-700" />
              <span>Conformité DTU & Guide de Pose</span>
            </div>
            <p className="text-[11px] text-amber-900/80 leading-relaxed">
              {selectedLayer.dtuNotes}
            </p>
          </div>
        )}
      </div>

      {/* Interactive Quick Stats at Footer of Config Panel */}
      {selectedLayer && (
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center text-xs">
          <div>
            <span className="text-slate-400 block text-[9px] uppercase tracking-widest font-mono">
              Contribution Thermique
            </span>
            <div className="text-white font-mono font-bold mt-0.5">
              {selectedLayer.fixedR !== null ? (
                <>R = {selectedLayer.fixedR.toFixed(2)}</>
              ) : (
                <>
                  R = {selectedLayer.id === "main_structure" ? (
                    // Approximate framing blend 10%
                    (selectedLayer.thickness / 1000 / ((activeMaterial?.lambda ?? 0.038) * 0.9 + 0.13 * 0.1)).toFixed(2)
                  ) : (
                    (selectedLayer.thickness / 1000 / (activeMaterial?.lambda ?? 0.04)).toFixed(2)
                  )}
                </>
              )}
              <span className="text-[10px] text-slate-300 font-normal ml-1">m².K/W</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-slate-400 block text-[9px] uppercase tracking-widest font-mono">
              Densité Matériau
            </span>
            <div className="text-white font-mono font-bold mt-0.5 flex items-center gap-1 justify-end">
              <span>{activeMaterial ? activeMaterial.density : selectedLayer.density}</span>
              <span className="text-[10px] text-slate-300 font-normal">kg/m³</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
