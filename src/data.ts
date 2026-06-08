/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WallLayer } from "./types";

export const INITIAL_LAYERS: WallLayer[] = [
  {
    id: "plasterboard",
    name: "Plaque de plâtre (placo)",
    description: "Finition intérieure pour les murs et plafonds. Assure un rendu lisse prêt à peindre et participe à la protection incendie ainsi qu'à l'étanchéité à l'air des parois.",
    thickness: 13,
    minThickness: 10,
    maxThickness: 26,
    lambda: 0.25,
    fixedR: null,
    density: 800,
    specificHeat: 1000,
    color: "#e5e7eb", // Soft gray-white
    patternType: "solid",
    role: "Finition & Protection coupe-feu",
    dtuNotes: "DTU 25.41 : Pose sur ossature métallique avec vis spécifiques (TTPC 25) espacées de 30 cm maximum. Les joints doivent être traités par bandes et enduit.",
    isConfigurable: true,
    selectedMaterialIndex: 0,
    materialChoices: [
      {
        name: "Plâtre BA13 Standard",
        lambda: 0.25,
        density: 800,
        specificHeat: 1000,
        carbonFootprint: "Moyen",
        type: "Plâtre",
        approxPricePerM2: 5,
        description: "Plaque standard à bords amincis de 12.5mm d'épaisseur."
      },
      {
        name: "Double Placo BA13 (Phonique)",
        lambda: 0.25,
        density: 950,
        specificHeat: 1000,
        carbonFootprint: "Moyen",
        type: "Plâtre",
        approxPricePerM2: 12,
        description: "Deux plaques croisées BA13 améliorant l'affaiblissement acoustique de +3 à +5 dB."
      },
      {
        name: "Plaque Fermacell 12.5mm",
        lambda: 0.32,
        density: 1150,
        specificHeat: 1100,
        carbonFootprint: "Bon",
        type: "Gypse-cellulose",
        approxPricePerM2: 14,
        description: "Haute rigidité, régulation de l'humidité et résistance mécanique accrue."
      }
    ]
  },
  {
    id: "service_gap",
    name: "Système rails métalliques (vide technique)",
    description: "Espace vide d'isolation permettant le passage propre des gaines électriques et de plomberie sans percer la membrane d'étanchéité à l'air (frein-vapeur), évitant tout risque de fuite.",
    thickness: 45,
    minThickness: 40,
    maxThickness: 60,
    lambda: null,
    fixedR: 0.17, // R-value of unventilated horizontal air gap
    density: 1.2, // Air density
    specificHeat: 1000,
    color: "#9ca3af", // Metallic outline with air gap
    patternType: "air",
    role: "Passage technique & Lame d'air isolante",
    dtuNotes: "Pose des montants métalliques (M48 ou F530) espacés généralement de 60 cm. Respect d'une épaisseur minimale de 40mm pour les boîtiers électriques préfabriqués (RT/RE2020 strict).",
    isConfigurable: true,
    selectedMaterialIndex: 0,
    materialChoices: [
      {
        name: "Vide d'Air non ventilé (45mm)",
        lambda: 0.26, // equivalent equivalent for 45mm
        density: 1.2,
        specificHeat: 1000,
        carbonFootprint: "Excellent",
        type: "Air",
        approxPricePerM2: 2,
        description: "L’air immobile fait office d'isolant modéré tout en laissant libre le passage des gaines."
      },
      {
        name: "Laine Acoustique de Chanvre/Lin (45mm)",
        lambda: 0.038,
        density: 35,
        specificHeat: 1600,
        carbonFootprint: "Excellent",
        type: "Biosourcé",
        approxPricePerM2: 8,
        description: "Isolant fibreux écoresponsable augmentant à la fois l'affaiblissement phonique et l'isolation thermique."
      },
      {
        name: "Laine de Roche Acoustique (45mm)",
        lambda: 0.037,
        density: 40,
        specificHeat: 1030,
        carbonFootprint: "Moyen",
        type: "Minéral",
        approxPricePerM2: 6,
        description: "Solution minérale classique pour l'isolation phonique et la résistance au feu."
      }
    ]
  },
  {
    id: "vapour_barrier",
    name: "Membrane d’étanchéité à l’air (frein-vapeur)",
    description: "Film continu qui régule les transferts de vapeur d'eau à travers la paroi de l'intérieur vers l'extérieur pour éviter la condensation dans les isolants, tout en assurant une étanchéité à l'air parfaite (test d'infiltrométrie).",
    thickness: 0.2, // ~0.2mm
    lambda: 0.33,
    fixedR: 0.02,
    density: 900,
    specificHeat: 1800,
    color: "#60a5fa", // Bright blue membrane
    patternType: "membrane",
    role: "Étanchéité à l'air & Régulation hygrométrique",
    dtuNotes: "DTU 31.2 : Continuité indispensable. Les lés doivent se chevaucher de 10 cm au minimum et être raccordés par adhésifs certifiés. Mastic d'étanchéité continu en périphérie (sol, plafond, angles).",
    isConfigurable: true,
    selectedMaterialIndex: 0,
    materialChoices: [
      {
        name: "Membrane hygrovariable (Sd 0.25m à >25m)",
        lambda: 0.33,
        density: 110, // g/m²
        specificHeat: 1800,
        carbonFootprint: "Bon",
        type: "Synthétique régulée",
        approxPricePerM2: 3.5,
        description: "S'adapte dynamiquement selon la saison : étanche en hiver pour bloquer l'humidité, très ouverte en été pour favoriser le séchage."
      },
      {
        name: "Pare-vapeur étanche fixe (Sd > 18m)",
        lambda: 0.33,
        density: 150,
        specificHeat: 1800,
        carbonFootprint: "Moyen",
        type: "PE classique",
        approxPricePerM2: 1.8,
        description: "Film polyéthylène bloquant l'humidité de manière uniforme. Plus économique mais moins tolérant aux erreurs de pose."
      }
    ]
  },
  {
    id: "interior_insulation",
    name: "Isolant intérieur complémentaire (120 mm)",
    description: "Première couche d'isolation thermique majeure côté chaud, insérée derrière l'ossature de doublage. Elle vient considérablement renforcer la résistance globale tout en réduisant l'épaisseur requise pour la structure porteuse.",
    thickness: 120,
    minThickness: 40,
    maxThickness: 160,
    lambda: 0.038,
    fixedR: null,
    density: 50, // default fibre de bois
    specificHeat: 2100,
    color: "#fde047", // Soft warm yellow insulation
    patternType: "fiber",
    role: "Doublage isolant thermique et acoustique",
    dtuNotes: "DTU 31.2 et DTU 35.1 : L'isolant intérieur doit être parfaitement jointif avec le frein-vapeur et s'insérer de façon stable entre les rails ou tasseaux de l'ossature croisée secondaire.",
    isConfigurable: true,
    selectedMaterialIndex: 0,
    materialChoices: [
      {
        name: "Fibre de bois souple",
        lambda: 0.038,
        density: 50,
        specificHeat: 2100,
        carbonFootprint: "Excellent",
        type: "Biosourcé",
        approxPricePerM2: 19,
        description: "Excellent choix écologique offrant une capacité calorifique exceptionnelle pour le déphasage d'été."
      },
      {
        name: "Laine de verre GR32 (Haute performance)",
        lambda: 0.032,
        density: 25,
        specificHeat: 1030,
        carbonFootprint: "Moyen",
        type: "Minéral",
        approxPricePerM2: 14,
        description: "Très faible conductivité thermique permettant de maximiser les performances d'isolation pour une épaisseur donnée."
      },
      {
        name: "Ouate de cellulose (panneaux)",
        lambda: 0.039,
        density: 45,
        specificHeat: 1900,
        carbonFootprint: "Excellent",
        type: "Biosourcé recyclé",
        approxPricePerM2: 17,
        description: "Fabriqué à base de papier journal recyclé. Très bon équilibre phonique et confort d'été."
      }
    ]
  },
  {
    id: "main_structure",
    name: "Ossature bois 140 mm + isolant entre montants (140 mm)",
    description: "Le cœur structurel du mur. Squelette composé de montants en bois de 140 mm d'épaisseur (souvent entraxe 60 cm), accueillant un isolant performant dans tout son volume pour éliminer les déperditions directes.",
    thickness: 140,
    minThickness: 120,
    maxThickness: 220,
    lambda: 0.038, // overall average with framing computed dynamically
    fixedR: null,
    density: 55, // default insulation
    specificHeat: 2100,
    color: "#fca5a5", // Textured frame insulation, pink-peach wood visual
    patternType: "studs",
    role: "Structure porteuse & Isolation principale",
    dtuNotes: "DTU 31.2 : En bois massif ou bois reconstitué (classe de résistance C24). Une lisse d'ancrage basse et d'arase étanche au sol est requise avec bande d'étanchéité pour les remontées d'humidité.",
    isConfigurable: true,
    selectedMaterialIndex: 0,
    materialChoices: [
      {
        name: "Isolant Fibre de Bois (densité ~55 kg/m³)",
        lambda: 0.038,
        density: 55,
        specificHeat: 2100,
        carbonFootprint: "Excellent",
        type: "Biosourcé",
        approxPricePerM2: 24,
        description: "Finition haut de gamme, forte masse volumique idéale pour réduire la canicule estivale."
      },
      {
        name: "Laine de Roche semi-rigide (densité ~40 kg/m³)",
        lambda: 0.035,
        density: 40,
        specificHeat: 1030,
        carbonFootprint: "Moyen",
        type: "Minéral",
        approxPricePerM2: 18,
        description: "Très stable dimensionnellement dans le temps, haute sécurité feu et résistant à l'humidité."
      },
      {
        name: "Laine de verre semi-rigide (densité ~20 kg/m³)",
        lambda: 0.035,
        density: 20,
        specificHeat: 1030,
        carbonFootprint: "Moyen",
        type: "Minéral",
        approxPricePerM2: 15,
        description: "Option économique de haute efficacité isolante et facile à calfeutrer sans pont thermique."
      }
    ]
  },
  {
    id: "outer_insulation",
    name: "Panneau isolant extérieur type Isolair SOPREMA (60 mm)",
    description: "Panneau isolant robuste en fibre de bois rigide pare-pluie appliqué en extérieur. Il réalise une isolation continue (enveloppe ITE) bloquant tous les ponts thermiques créés par les montants d'ossature bois.",
    thickness: 60,
    minThickness: 20,
    maxThickness: 100,
    lambda: 0.041,
    fixedR: null,
    density: 200, // Very dense woodfibre
    specificHeat: 2100,
    color: "#ca8a04", // Brownish/mustard woodfiber hardboard
    patternType: "solid",
    role: "Rupture de pont thermique, Écran pare-pluie, Pare-vent rigide",
    dtuNotes: "La pose se fait au contact direct extérieur de l'ossature bois. Panneaux bouvetés (rainures et languettes) pour une étanchéité au vent impeccable. Doit pouvoir rester exposé aux intempéries temporairement.",
    isConfigurable: true,
    selectedMaterialIndex: 0,
    materialChoices: [
      {
        name: "Isolair SOPREMA (Fibre de bois rigide)",
        lambda: 0.041,
        density: 200,
        specificHeat: 2100,
        carbonFootprint: "Excellent",
        type: "Biosourcé ITE",
        approxPricePerM2: 18,
        description: "Panneau pare-pluie rigide, perspirant (perméable à la vapeur d'eau), améliorant le déphasage d'été de 3 heures."
      },
      {
        name: "Panneau Pare-Pluie Rigide Standard (Fibre d'entrée de gamme)",
        lambda: 0.044,
        density: 180,
        specificHeat: 2100,
        carbonFootprint: "Excellent",
        type: "Biosourcé",
        approxPricePerM2: 14,
        description: "Alternative économique de dalles de sous-toiture et de murs en fibre de bois."
      },
      {
        name: "Polyuréthane Rigide extérieur (Non recommandé perspirant)",
        lambda: 0.022,
        density: 32,
        specificHeat: 1400,
        carbonFootprint: "Élevé",
        type: "Synthétique",
        approxPricePerM2: 25,
        description: "Isolant ultra-fin hautement performant mais étanche à la vapeur d'eau, modifiant le comportement perspirant sain du bois."
      }
    ]
  },
  {
    id: "rain_barrier",
    name: "Écran pare-pluie HPV (Hautement Perméable à la Vapeur)",
    description: "Membrane d'étanchéité souple posée sur l'isolant rigide extérieur. Elle offre une étanchéité absolue face à l'eau de pluie et aux infiltrations d'air (vent) tout en évacuant la vapeur humide vers la lame d'air ventilée.",
    thickness: 1, // 1 mm
    minThickness: 0.5,
    maxThickness: 2,
    lambda: 0.17,
    fixedR: 0.02,
    density: 140, // g/m² converted
    specificHeat: 1300,
    color: "#2563eb", // Intense blue
    patternType: "membrane",
    role: "Étanchéité à la pluie, étanchéité au vent & transfert de vapeur",
    dtuNotes: "DTU 31.2 : Recouvrement horizontal de 15 cm minimum raccordé par adhésif armé extérieur. Fixation par agrafes sur support puis pincé par les lattes.",
    isConfigurable: true,
    selectedMaterialIndex: 0,
    materialChoices: [
      {
        name: "SOPREMA SOPRAVAP (Pare-pluie HPV)",
        lambda: 0.17,
        density: 140,
        specificHeat: 1300,
        carbonFootprint: "Excellent",
        type: "Membrane polypropylène",
        approxPricePerM2: 2.5,
        description: "Écran souple synthétique HPV standard, imperméable à l'eau liquide mais hautement perspirant (Sd ≈ 0,02 m)."
      },
      {
        name: "Pare-pluie Armé Spécial Claire-Voie",
        lambda: 0.17,
        density: 220,
        specificHeat: 1300,
        carbonFootprint: "Bon",
        type: "Enduction acrylique renforcée",
        approxPricePerM2: 6.5,
        description: "Membrane respirante haut de gamme hautement stabilisée aux UV, indispensable sous un bardage ajouré ou à claire-voie."
      }
    ]
  },
  {
    id: "ventilated_cavity",
    name: "Lattage vertical 27 mm (lame d’air ventilée)",
    description: "Cet espace de 27mm est crucial pour la pérennité du mur. L'air doit y circuler librement du bas vers le haut pour sécher instantanément l'humidité résiduelle sous le bardage due à la pluie batante.",
    thickness: 27,
    minThickness: 22,
    maxThickness: 45,
    lambda: null,
    fixedR: 0.08, // Strongly ventilated air layer has low fixed thermal resistance
    density: 1.2,
    specificHeat: 1000,
    color: "#6b7280", // Gray air gap structure
    patternType: "air",
    role: "Lame d'air fortement ventilée & Évacuation d'humidité",
    dtuNotes: "Pose obligatoire de tasseaux autoclaves (classe 3 min.) fixés dans l'ossature à travers le pare-pluie. Une grille anti-rongeurs (clotet anti-nuisibles) perforée doit habiller les entrées basses et les sorties hautes de la lame d'air.",
    isConfigurable: false,
    selectedMaterialIndex: 0,
    materialChoices: [
      {
        name: "Lame d'Air Ventilée Standard",
        lambda: null,
        density: 1.2,
        specificHeat: 1000,
        carbonFootprint: "Excellent",
        type: "Air",
        approxPricePerM2: 3,
        description: "Espace obligatoire ménagé par la pose de tasseaux bois traités en classe 3."
      }
    ]
  },
  {
    id: "wood_cladding",
    name: "Bardage bois mouluré vertical (60 mm)",
    description: "La parure esthétique de la maison. Les lames de bardage moulurées assemblées verticalement évacuent parfaitement l'eau et créent un relief d'une exceptionnelle qualité architecturale.",
    thickness: 60,
    minThickness: 18,
    maxThickness: 75,
    lambda: 0.13,
    fixedR: 0.05, // Considered low thermal impact in standard models due to external dynamic ventilation
    density: 550, // Larch, Pine, Cedar
    specificHeat: 1600,
    color: "#d97706", // Elegant amber wood tone
    patternType: "wood-vertical",
    role: "Protection climatique externe & Esthétique",
    dtuNotes: "DTU 41.2 : Garde au sol minimale de 20 cm par rapport au sol fini pour éviter les éclaboussures d'eau de pluie. Les fixations doivent s'effectuer par pointes inox crantées de longueur réglementaire.",
    isConfigurable: true,
    selectedMaterialIndex: 0,
    materialChoices: [
      {
        name: "Moulure en Mélèze Massif (60mm profil relief)",
        lambda: 0.13,
        density: 600,
        specificHeat: 1600,
        carbonFootprint: "Excellent",
        type: "Bois local durable",
        approxPricePerM2: 45,
        description: "Bois dense naturellement durable de classe 3, patine élégante gris argenté avec le temps."
      },
      {
        name: "Moulure en Red Cedar Premium (60mm profil relief)",
        lambda: 0.11,
        density: 450,
        specificHeat: 1600,
        carbonFootprint: "Bon",
        type: "Bois importé haute durabilité",
        approxPricePerM2: 75,
        description: "Stabilité dimensionnelle hors pair et esthétique naturelle somptueuse sans aucun traitement chimique."
      },
      {
        name: "Bardage Douglas traité (60mm relief)",
        lambda: 0.13,
        density: 540,
        specificHeat: 1600,
        carbonFootprint: "Excellent",
        type: "Douglas français",
        approxPricePerM2: 35,
        description: "Excellent rapport qualité/prix, très local, cœur de bois rouge naturellement résistant."
      }
    ]
  }
];
