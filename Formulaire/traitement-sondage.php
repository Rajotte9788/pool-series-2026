<?php
// ====== Réglages ======
header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/sondage-error.log');

$DEBUG = false;

// Adresse d'expédition
const FROM_ADDR = 'info@grinformatique.com';
const FROM_NAME = 'GR Informatique';

// Destinataires
$RECIPIENTS = [
  'jonathanrajotte@hotmail.com' => 'Jonathan',
];

// ====== Anti accès direct ======
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Méthode non autorisée']);
  exit;
}

// ====== Honeypot anti-spam ======
if (!empty($_POST['website'] ?? '')) {
  echo json_encode(['ok' => true]);
  exit;
}

// ====== Fonction nettoyage ======
function clean($data) {
  return trim(strip_tags($data ?? ''));
}

// ====== Données du sondage ======
$entrees_optionnelles = clean($_POST['entrees_optionnelles'] ?? '');
$entrees_autre        = clean($_POST['entrees_autre'] ?? '');
$stats_avancees       = clean($_POST['stats_avancees'] ?? '');
$facilite_site        = clean($_POST['facilite_site'] ?? '');
$echanges             = clean($_POST['echanges'] ?? '');
$carre_as             = clean($_POST['carre_as'] ?? '');
$ameliorations        = clean($_POST['ameliorations'] ?? '');

// ====== Validation minimale ======
if (
  $entrees_optionnelles === '' &&
  $entrees_autre === '' &&
  $stats_avancees === '' &&
  $facilite_site === '' &&
  $echanges === '' &&
  $carre_as === '' &&
  $ameliorations === ''
) {
  http_response_code(422);
  echo json_encode(['ok' => false, 'error' => 'Aucune réponse reçue.']);
  exit;
}

// ====== Construction du courriel ======
$subject = 'Nouvelle réponse au sondage du pool';

$body  = "Nouvelle réponse au sondage du pool reçue\n\n";
$body .= "Date : " . date('Y-m-d H:i:s') . "\n\n";

$body .= "===== RÉPONSES =====\n\n";

$body .= "1. Le système des 2 entrées optionnelles devrait-il revenir ?\n";
$body .= "- Réponse : " . ($entrees_optionnelles !== '' ? $entrees_optionnelles : '-') . "\n";
$body .= "- Autre : " . ($entrees_autre !== '' ? $entrees_autre : '-') . "\n\n";

$body .= "2. Les statistiques avancées étaient-elles utiles/intéressantes ?\n";
$body .= "- Réponse : " . ($stats_avancees !== '' ? $stats_avancees : '-') . "\n\n";

$body .= "3. Le site était-il facile à comprendre et utiliser ?\n";
$body .= "- Réponse : " . ($facilite_site !== '' ? $facilite_site : '-') . "\n\n";

$body .= "4. Les échanges devraient-ils ?\n";
$body .= "- Réponse : " . ($echanges !== '' ? $echanges : '-') . "\n\n";

$body .= "5. Prédiction des 4 équipes du carré d’as en début de pool ?\n";
$body .= "- Réponse : " . ($carre_as !== '' ? $carre_as : '-') . "\n\n";

$body .= "6. Idées ou améliorations pour l’an prochain :\n";
$body .= ($ameliorations !== '' ? $ameliorations : '-') . "\n";

// ====== Entêtes ======
$headers = [];
$headers[] = 'From: ' . FROM_NAME . ' <' . FROM_ADDR . '>';
$headers[] = 'Reply-To: ' . FROM_NAME . ' <' . FROM_ADDR . '>';
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'X-Mailer: PHP/' . phpversion();

$headers_str = implode("\r\n", $headers);

// ====== Liste des destinataires valides ======
$to_list = [];

foreach ($RECIPIENTS as $addr => $name) {
  $addr = trim($addr);

  if ($addr !== '' && filter_var($addr, FILTER_VALIDATE_EMAIL)) {
    $to_list[] = $name ? "\"" . addslashes($name) . "\" <{$addr}>" : $addr;
  } else {
    error_log("Destinataire ignoré, email invalide : {$addr}");
  }
}

if (empty($to_list)) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Aucun destinataire valide configuré.']);
  exit;
}

$to = implode(', ', $to_list);

// Paramètre supplémentaire
$additional_params = '-f' . FROM_ADDR;

// ====== Envoi courriel ======
$ok = @mail($to, $subject, $body, $headers_str, $additional_params);

// ====== Sauvegarde locale CSV ======
$csv_file = __DIR__ . '/reponses-sondage.csv';
$is_new_file = !file_exists($csv_file);

$fp = @fopen($csv_file, 'a');

if ($fp) {
  if ($is_new_file) {
    fputcsv($fp, [
      'Date',
      '2 entrées optionnelles',
      'Autre réponse',
      'Statistiques avancées',
      'Facilité du site',
      'Échanges',
      'Carré d’as',
      'Idées / améliorations',
      'Courriel envoyé'
    ], ';');
  }

  fputcsv($fp, [
    date('c'),
    $entrees_optionnelles,
    $entrees_autre,
    $stats_avancees,
    $facilite_site,
    $echanges,
    $carre_as,
    $ameliorations,
    ($ok ? 'OK' : 'FAIL')
  ], ';');

  fclose($fp);
} else {
  error_log("Impossible d'écrire dans reponses-sondage.csv");
}

// ====== Réponse JSON ======
if ($ok) {
  echo json_encode(['ok' => true]);
} else {
  error_log('mail() a renvoyé false dans traitement-sondage.php');

  http_response_code(500);
  echo json_encode([
    'ok' => false,
    'error' => $DEBUG ? 'mail() failed' : "L'envoi a échoué. Réessaie plus tard."
  ]);
}