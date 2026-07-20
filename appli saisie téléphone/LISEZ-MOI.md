# Suivi Irrigation — mise en place (15 minutes)

L'appli est composée de 4 fichiers : `index.html`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`, et un script séparé `Code.gs` à coller dans Google Sheets. Aucun de ces fichiers ne doit être renommé.

Cette version colle exactement à la structure de `irrigation_truffiere_2026.xlsx` : chaque onglet (**La Fontaine**, **La baume**, **Pilles**, **Bousquet et Riou**) contient 2 ou 3 "lignes" d'irrigation côte à côte (ex. Bousquet et Riou = Ligne 1 "Bousquet" + Ligne 2 "Riou"). L'appli te fait donc choisir d'abord la parcelle, puis la ligne, avant le formulaire.

Le script retrouve automatiquement la bonne colonne et la bonne ligne libre dans le tableau — il ne touche jamais aux colonnes **Débit (m3/h)** et **mm**, qui restent calculées par formule, ni aux lignes "TOTAL Mois". Il ne remplit que : Date, Durée, Compteur début, Compteur fin et M3.

## Étape 1 — Créer le script Google Apps Script

1. Ouvre ton Google Sheet.
2. Menu **Extensions > Apps Script**.
3. Supprime le code par défaut, colle le contenu de `Code.gs`.
4. Clique **Déployer > Nouveau déploiement**.
5. Type de déploiement : **Application Web**.
6. "Exécuter en tant que" : **Moi**. "Qui a accès" : **Tout le monde**.
7. Clique **Déployer**, accepte les autorisations Google demandées.
8. Copie l'URL fournie (elle ressemble à `https://script.google.com/macros/s/XXXXX/exec`).

## Étape 2 — Configurer l'appli

Ouvre `index.html`, trouve la ligne suivante en haut du `<script>` :

```js
const SCRIPT_URL = "COLLE_ICI_TON_URL_APPS_SCRIPT";
```

Remplace par ton URL copiée à l'étape 2.

## Étape 3 — Mettre l'appli en ligne (nécessaire pour l'installer sur Android)

Le plus simple, vu que tu utilises déjà GitHub : crée un nouveau dépôt, ajoute les 5 fichiers (`index.html`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png` — pas besoin de `Code.gs` ni de ce fichier), puis active **GitHub Pages** :

1. Sur GitHub, crée un repo (ex : `irrigation-app`), ajoute les fichiers.
2. Va dans **Settings > Pages**.
3. Source : **Deploy from a branch**, branche `main`, dossier `/ (root)`.
4. Après 1-2 minutes, ton appli est en ligne à une adresse du type :
   `https://ton-pseudo.github.io/irrigation-app/`

(Toute autre solution d'hébergement HTTPS statique fonctionne aussi : Netlify, Vercel, etc. GitHub Pages est gratuit et simple vu que tu as déjà l'habitude de Git.)

## Étape 4 — Installer sur ton téléphone Android

1. Ouvre l'URL ci-dessus dans **Chrome** sur ton téléphone.
2. Menu ⋮ (trois points) > **Installer l'application** (ou "Ajouter à l'écran d'accueil").
3. Une icône apparaît sur ton écran d'accueil, elle s'ouvre en plein écran comme une vraie appli.

## Utilisation au quotidien

1. Ouvre l'appli → choisis la parcelle (onglet).
2. Choisis la ligne (ex : Bousquet ou Riou).
3. Renseigne date, durée, compteur début, compteur fin — le volume M3 se calcule automatiquement (modifiable si besoin).
4. Appuie sur **Enregistrer**.
5. La donnée part dans la première ligne encore libre du bon bloc de colonnes, dans le bon onglet — sans jamais toucher aux formules Débit/mm ni aux lignes TOTAL. Le compteur début suivant est pré-rempli avec le compteur fin que tu viens de saisir, pour aller plus vite sur la saisie suivante.

## Si quelque chose ne fonctionne pas

- **"Onglet introuvable"** : le nom de l'onglet dans le Sheet ne correspond pas exactement — vérifie l'orthographe (espaces, accents). Les onglets attendus sont : La Fontaine, La baume, Pilles, Bousquet et Riou.
- **"Bloc 'Ligne N' introuvable"** : le libellé "Ligne 1" / "Ligne 2" / "Ligne 3" a été renommé ou supprimé dans le Sheet — l'appli s'appuie sur ce texte pour retrouver la bonne colonne.
- **"Plus de ligne libre"** : le tableau pré-construit (jusqu'à la ligne 34-41 selon l'onglet) est entièrement rempli — il faut l'étendre manuellement dans le Sheet (copier les formules Débit/mm vers le bas) avant de continuer à saisir depuis l'appli.
- **Échec de l'envoi** : vérifie la connexion internet du téléphone, et que l'URL dans `SCRIPT_URL` est bien complète (se terminant par `/exec`).
- Si tu modifies `Code.gs` plus tard, il faut redéployer une **nouvelle version** (Déployer > Gérer les déploiements > icône crayon > Version : Nouvelle version), sinon Google continue de servir l'ancienne version.
