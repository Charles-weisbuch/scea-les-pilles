/**
 * À COLLER DANS : Google Sheet > Extensions > Apps Script
 *
 * Fonctionnement : chaque onglet (La Fontaine, La baume, Pilles, Bousquet et Riou)
 * contient 2 ou 3 "lignes" d'irrigation côte à côte, chacune avec son bloc de colonnes
 * Date | Durée (h) | Compteur début | Compteur fin | Débit (m3/h) [formule] | M3 | mm [formule].
 *
 * Ce script :
 *  1. Repère automatiquement la colonne de la ligne demandée en cherchant le libellé
 *     "Ligne 1", "Ligne 2", etc. (peu importe le texte ajouté après, ex. "Ligne 1 (Bousquet)").
 *  2. Repère la première ligne encore vide dans la colonne "M3" de ce bloc
 *     (les lignes TOTAL contiennent déjà une formule, donc jamais vides — elles sont
 *     automatiquement ignorées).
 *  3. Écrit uniquement Date, Durée, Compteur début, Compteur fin et M3.
 *     Les colonnes Débit et mm ne sont jamais touchées : si leur formule manque déjà
 *     sur la ligne visée, elle est recopiée depuis la ligne du dessus.
 *
 * Mise en place :
 *  1. Colle ce code dans Extensions > Apps Script (remplace le contenu existant).
 *  2. Déployer > Nouveau déploiement > Type "Application Web".
 *  3. Exécuter en tant que : Moi. Qui a accès : Tout le monde.
 *  4. Déployer, autoriser les permissions, copier l'URL fournie.
 *  5. Coller cette URL dans SCRIPT_URL en haut de index.html.
 *
 * Si tu modifies ce script plus tard : Déployer > Gérer les déploiements >
 * crayon > Version : Nouvelle version (sinon les changements ne prennent pas effet).
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var wantedSheet = (data.onglet || "").trim().toLowerCase();
    var sheet = null;
    ss.getSheets().forEach(function (s) {
      if (s.getName().trim().toLowerCase() === wantedSheet) sheet = s;
    });
    if (!sheet) {
      return jsonOutput({ ok: false, error: "Onglet introuvable : " + data.onglet });
    }

    var ligneIndex = parseInt(data.ligne, 10);
    if (!ligneIndex) {
      return jsonOutput({ ok: false, error: "Numéro de ligne manquant." });
    }

    // 1) Trouver la colonne de bloc en cherchant le libellé "Ligne N..." dans les 6 premières lignes
    var scanRows = 6;
    var scanCols = sheet.getLastColumn();
    var values = sheet.getRange(1, 1, scanRows, scanCols).getValues();
    var ligneRegex = new RegExp("^Ligne\\s*" + ligneIndex + "(\\s|\\(|$)", "i");

    var blockCol = -1, ligneRow = -1;
    for (var r = 0; r < scanRows && blockCol === -1; r++) {
      for (var c = 0; c < scanCols; c++) {
        var v = values[r][c];
        if (v && ligneRegex.test(v.toString().trim())) {
          blockCol = c + 1; // 1-indexed column
          ligneRow = r + 1;
          break;
        }
      }
    }
    if (blockCol === -1) {
      return jsonOutput({ ok: false, error: "Bloc 'Ligne " + ligneIndex + "' introuvable dans l'onglet " + data.onglet });
    }

    // 2) Trouver la ligne d'en-tête ("Date") dans cette même colonne, sous le libellé "Ligne N"
    var headerRow = -1;
    for (var rr = ligneRow; rr <= ligneRow + 10; rr++) {
      var cellVal = sheet.getRange(rr, blockCol).getValue();
      if (cellVal && cellVal.toString().trim().toLowerCase() === "date") {
        headerRow = rr;
        break;
      }
    }
    if (headerRow === -1) {
      return jsonOutput({ ok: false, error: "En-tête 'Date' introuvable pour la ligne " + ligneIndex });
    }

    var dataStartRow = headerRow + 2; // saute la ligne de sous-en-têtes "M3 / mm"

    // Colonnes du bloc (relatives à blockCol) :
    // +0 Date | +1 Durée (h) | +2 Compteur début | +3 Compteur fin | +4 Débit (formule) | +5 M3 | +6 mm (formule)
    var colDate = blockCol;
    var colDuree = blockCol + 1;
    var colDebut = blockCol + 2;
    var colFin = blockCol + 3;
    var colDebit = blockCol + 4;
    var colM3 = blockCol + 5;
    var colMm = blockCol + 6;

    // 3) Trouver la première ligne vide dans la colonne M3 (les lignes TOTAL ont une formule, donc non vides)
    var maxScan = 300;
    var targetRow = -1;
    for (var rowI = dataStartRow; rowI < dataStartRow + maxScan; rowI++) {
      var m3Cell = sheet.getRange(rowI, colM3);
      if (m3Cell.getValue() === "" || m3Cell.getValue() === null) {
        targetRow = rowI;
        break;
      }
    }
    if (targetRow === -1) {
      return jsonOutput({ ok: false, error: "Plus de ligne libre dans le tableau — il faut l'étendre manuellement." });
    }

    // Recopie les formules Débit / mm depuis la ligne au-dessus si elles manquent sur la ligne cible
    var debitCell = sheet.getRange(targetRow, colDebit);
    if (!debitCell.getFormula() && targetRow > dataStartRow) {
      sheet.getRange(targetRow - 1, colDebit).copyTo(debitCell, { formulaOnly: true });
    }
    var mmCell = sheet.getRange(targetRow, colMm);
    if (!mmCell.getFormula() && targetRow > dataStartRow) {
      sheet.getRange(targetRow - 1, colMm).copyTo(mmCell, { formulaOnly: true });
    }

    // 4) Écriture des valeurs saisies
    var dateValue = data.date ? new Date(data.date + "T00:00:00") : "";
    sheet.getRange(targetRow, colDate).setValue(dateValue);
    sheet.getRange(targetRow, colDuree).setValue(Number(data.duree));
    sheet.getRange(targetRow, colDebut).setValue(Number(data.compteur_debut));
    sheet.getRange(targetRow, colFin).setValue(Number(data.compteur_fin));
    sheet.getRange(targetRow, colM3).setValue(Number(data.m3));

    return jsonOutput({ ok: true, row: targetRow });
  } catch (err) {
    return jsonOutput({ ok: false, error: err.message });
  }
}

function doGet(e) {
  return ContentService.createTextOutput("L'API fonctionne. Utilise une requête POST pour envoyer des données.");
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
