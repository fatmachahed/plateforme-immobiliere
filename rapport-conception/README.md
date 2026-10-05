# Rapport — Conception et modélisation d'une plateforme de géolocalisation des biens immobiliers en Tunisie

Version **v0.2 — compacte** (cible ≤ 35 pages). Basée **à la lettre** sur le
template LaTeX fourni. **Périmètre : conception et modélisation uniquement** —
aucune partie développement (pas de stack technique, frameworks, déploiement).

## Compilation

```bash
pdflatex main.tex
pdflatex main.tex   # 2e passe : table des matières / figures / références
```

(Pas de compilateur LaTeX sur ce poste — non testé ici. Utiliser Overleaf ou
TeX Live / MiKTeX.)

## Structure

```
rapport-conception/
├── main.tex                 # préambule (template), page de garde, liminaires, biblio
├── chapters/
│   ├── chapitre1.tex        # Ch.1 — Introduction générale
│   ├── chapitre2.tex        # Ch.2 — Contexte général (organisme, existant, problématique, cahier des charges)
│   ├── chapitre3.tex        # Ch.3 — Solution proposée (concepts clés, solution, acteurs, cas d'utilisation)
│   ├── chapitre4.tex        # Ch.4 — Conception et modélisation (archi, séquence, activité, classes, BD : MCD/MLD/dico)
│   ├── chapitre5.tex        # Ch.5 — Conception des interfaces utilisateur (UX/UI, Figma)
│   └── chapitre8.tex        # Ch.6 — Conclusion générale et perspectives
└── images/                  # PLACEHOLDERS générés — à remplacer par les vrais visuels
```

## À faire / à adapter

Chercher `À ADAPTER`, `À FOURNIR`, `À compléter`, `[...]` :

- **main.tex** : université, diplôme, encadrants, nom de l'étudiant, logos
  (`images/logo-universite.png`, `images/logo-entreprise.png`), dédicaces,
  remerciements.
- **chapitre2.tex** : présentation complète de l'organisme d'accueil.
- **images/** : remplacer les PNG placeholder par les vrais diagrammes
  (StarUML / draw.io / Looping) et écrans Figma :
  - UML : `uc-global`, `seq-recherche-carte`, `seq-publier-annonce`,
    `activite-cycle-annonce`, `diagramme-classes`
  - BD : `mcd`
  - UX/UI (Figma) : `parcours-recherche`, `arborescence`, `wf-carte`,
    `wf-detail`, `wf-creer-annonce`, `wf-dashboard-agence`,
    `maquette-accueil`, `maquette-carte`, `maquette-detail`
- **chapitre5.tex** : coller le lien du prototype Figma.

## Contrôle de la pagination

Après compilation, si le PDF dépasse 35 pages : réduire le nombre de figures
pleine largeur (passer certaines maquettes en demi-page / 2 par page), ou fondre
les sous-sections courtes.
