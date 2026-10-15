# FRAME — Beyond the Screen

Galerie digitale expérimentale : ouverture cinématographique, sculpture chromée interactive en temps réel et trois œuvres génératives originales.

## Lancer

```bash
npm install
npm run dev      # développement
npm run build    # vérification TypeScript + build de production
npm run preview  # servir le build
```

## Stack

React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · GSAP 3 (ScrollTrigger) · React Three Fiber 9 + drei · Lenis (défilement fluide).

## Structure

- `src/components/Intro.tsx` : ouverture. Le noir se déchire en cadre sur la sculpture, puis le cadre devient l'écran.
- `src/components/Hero.tsx` + `src/three/Sculpture.tsx` : sculpture chromée (glisser pour tourner, cliquer pour l'onde de choc) et typographie variable qui s'épaissit à l'approche du pointeur.
- `src/lib/artworks.ts` : les trois œuvres, écrites en shaders GLSL et rendues par `ShaderCanvas` (WebGL brut, mises en pause hors écran).
- `src/components/Gallery.tsx` / `ViewingRoom.tsx` : défilement horizontal épinglé sur desktop, pile verticale sur mobile, salle de visionnage plein écran (flèches, Échap, balayage tactile).
- `src/components/Nav.tsx` : en-tête qui suit la salle courante, barre de progression, menu plein écran.

## Accessibilité et repli

`prefers-reduced-motion` coupe l'intro, le défilement fluide et les animations liées au scroll. Sans WebGL, des visuels CSS statiques prennent le relais. Navigation clavier complète, focus piégé dans les fenêtres modales et restauré à la fermeture.

## Plugins Claude Code

`.claude/settings.json` déclare les plugins UI UX Pro Max et Impeccable. Claude Code les propose à l'installation lorsqu'on ouvre ce dépôt et qu'on lui fait confiance.
