# Site Ady Ankraj — comment le modifier

Une seule page : « la boutique ouvre bientôt », avec l'inscription pour être prévenu·e.
Site statique (HTML, CSS, JavaScript), hébergé sur Netlify depuis le dépôt GitHub `Adyankraj/Site` :
chaque modification envoyée sur GitHub met le site à jour.

## Où se trouve quoi
```
index.html              la page (textes en anglais par défaut)
assets/css/style.css    couleurs, polices, mise en page (couleurs au début, bloc :root)
assets/js/site.js       textes FR / EN, apparition de la signature, formulaire
assets/js/fond.js       fond animé (brume, lumière, étoiles, éclipse) : rien à régler
img/signature.png       la signature « ady »
img/favicon.png, img/apple-touch-icon.png   icônes de l'onglet et du téléphone
fonts/                  polices (Cormorant Garamond, Manrope), licence OFL incluse
og-image.jpg            image affichée quand on partage le lien
robots.txt, sitemap.xml pour Google
```

## Modifications courantes
- **Changer un texte** : les textes sont dans `assets/js/site.js`, bloc `T`, en anglais (`en`) et en français (`fr`).
  Changer les deux langues. Le texte de `index.html` n'est que la version de départ.
- **Inscriptions** : elles arrivent dans Netlify › Forms › « ouverture » (e-mail, téléphone, langue).
  Ouvert depuis l'ordinateur, le formulaire est en mode aperçu : rien n'est envoyé.
- **Polices** : hébergées dans `fonts/`, rien n'est chargé depuis Google.

## Avant d'ouvrir la boutique
- Ajouter les mentions légales (obligatoires pour un site professionnel en France) une fois le SIRET reçu.
- Adresse officielle : `https://adyankraj.com` (domaine principal dans Netlify, qui renvoie lui-même `www.adyankraj.com` vers elle). DNS chez OVH : A `@` vers 75.2.60.5 et CNAME `www` vers `ady-site.netlify.app`, sans toucher aux réglages e-mail (MX).

## Versions
- V1 (19/11/2026) : page unique, tout dans un seul fichier.
- V2 (22/11/2026) : code rangé (styles, scripts, image et polices séparés), polices hébergées sur le site,
  formulaire relié à Netlify Forms, icônes, robots.txt et sitemap.xml.
- V3 (22/11/2026) : domaine adyankraj.com branché dans Netlify (www redirigé vers l'adresse sans www), mention « tous droits réservés ».
