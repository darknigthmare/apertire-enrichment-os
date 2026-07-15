# APERTURE ENRICHMENT OPERATING SYSTEM (AEOS)
### *Central Core Test Chamber Management Console*

> **IMPORTANT NOTICE:** Projet fan-made local et privé. Aucun asset officiel (logos, musiques, dialogues, voix ou illustrations Valve/Portal) n'est inclus. Les illustrations raster originales ont été générées avec OpenAI pour ce projet fan-made ; l'interface conserve également ses styles CSS, structures SVG dynamiques et sons programmatiques générés localement par la Web Audio API.

---

## 🔬 Description du Projet

L'**Aperture Enrichment Operating System (AEOS)** est une console locale de gestion, supervision, édition et simulation de chambres de test dans l'univers d'Aperture Science. Elle donne à l'utilisateur l'impression d'être connecté au noyau central (de type CLaDOS) supervisant les cobayes humains, androïdes co-op, configurations géométriques et diagnostics du réacteur.

---

## 🛠️ Stack Technique

* **Framework & Logic** : React 18+ (TypeScript) + Vite
* **Design & Styling** : Pure Vanilla CSS avec variables customisées (effet de moniteur CRT, lueurs bleues/oranges, corner clips, scrollbars personnalisées).
* **Synthétiseur Audio** : Web Audio API locale (sons de boot, alarmes de danger, bips de touches).
* **Base de Données** : In-Memory Database client-side synchronisée avec le `localStorage`.
* **Tests** : Script de diagnostics Node CLI (`src/scratch/runTests.js`) et suite d'autodiagnostic intégrée en UI.

---

## 📂 Structure du Projet

```
excited-turing/
├── src/
│   ├── components/         # Reusable widgets (ApertureButton, BootSequence, SoundSynth, etc.)
│   ├── data/               # Seed data (seedChambers, seedSubjects, etc.)
│   ├── db/                 # localStorage Database wrapper & log handlers
│   ├── pages/              # Primary view pages (Dashboard, Editor, TestRunner, etc.)
│   ├── simulation/         # Chamber validation & timeline simulator engines
│   ├── styles/             # Global CSS themes and terminal visual filters
│   ├── types/              # TypeScript interface models
│   ├── App.tsx             # Root page layout switchboard
│   └── main.tsx            # App bootstrap
├── index.html              # Head SEO configurations
├── package.json            # Scripts & configurations
└── README.md
```

---

## 🚀 Démarrage et Déploiement

### 1. Installation
Installez les dépendances requises (React, TypeScript, Vite) en local :
```bash
npm install
```

### 2. Lancement Local (Serveur de Dév)
Exécutez le serveur de développement local :
```bash
npm run dev
```
Ouvrez l'adresse affichée (généralement `http://localhost:5173`) dans votre navigateur de choix.

### 3. Exécution de la Suite de Tests CLI
Lancez les diagnostics et vérifications unitaires de l'assistant :
```bash
npm run test
```

### 4. Build de Production (Statique)
Compilez et compressez les fichiers pour un déploiement web ou Electron :
```bash
npm run build
```

---

## 🎮 Mode d'Emploi des Modules

### 🛠️ Éditeur de Chambres 2D
1. Accédez au **Registre Chambres** et cliquez sur **+ Nouvelle Chambre**.
2. Remplissez le matricule, le nom, le style visuel (Clinical, Decayed, Old Aperture) et la taille de grille.
3. Cliquez sur **Éditer** pour ouvrir la grille interactive.
4. Sélectionnez les composants à gauche (sas, portails, plaques de foi, lasers, tourelles) et peignez-les sur la toile.
5. Sélectionnez une cellule en mode **SÉLECT** pour modifier sa rotation ou **Lier** un trigger (lier un bouton à la porte de sortie).
6. Les anomalies de calibrage (ex : pas d'entrée, pas de sortie, laser sans récepteur) s'affichent sous forme de rapports sarcastiques en bas de page.

### ⚙️ Simulateur de Tests
1. Allez sur le **Simulateur de Tests**.
2. Choisissez la chambre géométrique et le cobaye (sujet humain ou androïde co-op).
3. Activez les équipements et les directives (Double portail, Gels, lasers) et choisissez l'humeur vocale.
4. Cliquez sur **Lancer la Simulation**.
5. Observez le défilement chronologique des logs et le tracé graphique en SVG du rendement scientifique.
6. Lisez l'évaluation finale et les critiques de la persona CLaDOS.

### 🗣️ Console d'Annonces Vocales
Configurez des avertissements à l'aide de variables dynamiques et de phrases pré-enregistrées de la persona, puis cliquez sur **Diffuser l'annonce** pour faire sonner les carillons d'alerte.

### 💾 Sauvegarde & Restauration
Copiez la structure complète de votre installation en JSON dans le presse-papier ou téléchargez le fichier de sauvegarde local pour le transférer.

---

## 🎨 Crédits visuels

Les illustrations originales générées avec OpenAI sont regroupées dans `public/visuals/` :

* `subjects/` : portraits des sujets et unités de test.
* `cores/` : portraits des noyaux de personnalité.
* `turrets/` : états visuels des tourelles.
* `chambers/` : miniatures des chambres de test préconfigurées.
* `dashboard/` : bannière de supervision centrale.
* `facility/` : vue d'ensemble des systèmes d'infrastructure.
* `social/` : visuel de partage du projet.

Ces créations sont propres à ce projet fan-made et n'impliquent aucune affiliation ni approbation de Valve Corporation ou d'OpenAI.

---

## 🛡️ Mentions Légales
Ce projet est un travail d'apprentissage fan-made réalisé à titre éducatif privé. Valve, Portal, Aperture Science et GLaDOS sont des marques déposées de Valve Corporation. Aucun contenu officiel n'est distribué ni exploité commercialement.
