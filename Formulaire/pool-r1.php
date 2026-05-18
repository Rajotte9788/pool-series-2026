<?php
// ====== Réglages ======
header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/pool-error.log');

$DEBUG = false;

// Adresse d'expédition
const FROM_ADDR = 'info@grinformatique.com';
const FROM_NAME = 'GR Informatique';

// Destinataires
$RECIPIENTS = [
  'jonathanrajotte@hotmail.com'  => 'Jonathan',
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

// ====== Données formulaire ======
$participant = trim($_POST['participantName'] ?? '');
$entry1CupWinner = trim($_POST['entry1_cupWinner'] ?? '');
$enableSecondEntry = !empty($_POST['enableSecondEntry']);

// Validation minimale
if ($participant === '' || $entry1CupWinner === '') {
  http_response_code(422);
  echo json_encode(['ok' => false, 'error' => 'Le nom du participant et la Coupe Stanley sont requis.']);
  exit;
}

// ====== Construction du message ======
$subject = 'Nouvelle prédiction du pool';

$body  = "Nouvelle prédiction reçue\n\n";
$body .= "Participant : {$participant}\n";
$body .= "2e entrée : " . ($enableSecondEntry ? 'Oui' : 'Non') . "\n\n";

$body .= "===== ENTRÉE 1 =====\n";
$body .= "Coupe Stanley : " . ($entry1CupWinner !== '' ? $entry1CupWinner : '-') . "\n\n";

$body .= "Joueurs - Entrée 1 :\n";
for ($i = 1; $i <= 3; $i++) {
  $player = trim($_POST["entry1_player{$i}"] ?? '');
  $body .= "Joueur {$i} : " . ($player !== '' ? $player : '-') . "\n";
}

$body .= "\nRonde 1 - Entrée 1 :\n";
for ($i = 1; $i <= 8; $i++) {
  $winner = trim($_POST["entry1_series{$i}_winner"] ?? '');
  $games  = trim($_POST["entry1_series{$i}_games"] ?? '');
  $body .= "Série {$i} : " . ($winner !== '' ? $winner : '-') . " en " . ($games !== '' ? $games : '-') . " matchs\n";
}

// ====== Entrée 2 ======
if ($enableSecondEntry) {
  $entry2CupWinner = trim($_POST['entry2_cupWinner'] ?? '');

  $body .= "\n\n===== ENTRÉE 2 =====\n";
  $body .= "Coupe Stanley : " . ($entry2CupWinner !== '' ? $entry2CupWinner : '-') . "\n\n";

  $body .= "Joueurs - Entrée 2 :\n";
  for ($i = 1; $i <= 3; $i++) {
    $player = trim($_POST["entry2_player{$i}"] ?? '');
    $body .= "Joueur {$i} : " . ($player !== '' ? $player : '-') . "\n";
  }

  $body .= "\nRonde 1 - Entrée 2 :\n";
  for ($i = 1; $i <= 8; $i++) {
    $winner = trim($_POST["entry2_series{$i}_winner"] ?? '');
    $games  = trim($_POST["entry2_series{$i}_games"] ?? '');
    $body .= "Série {$i} : " . ($winner !== '' ? $winner : '-') . " en " . ($games !== '' ? $games : '-') . " matchs\n";
  }
}

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
    error_log("Destinataire ignoré (email invalide) : {$addr}");
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

// ====== Envoi ======
$ok = @mail($to, $subject, $body, $headers_str, $additional_params);

// ====== Sauvegarde locale ======
$csv_line = [
  date('c'),
  $participant,
  $entry1CupWinner,
  ($enableSecondEntry ? 'Oui' : 'Non'),
  ($ok ? 'OK' : 'FAIL')
];
@file_put_contents(__DIR__ . '/pool-submissions.csv', implode(';', $csv_line) . PHP_EOL, FILE_APPEND);

if ($ok) {
  echo json_encode(['ok' => true]);
} else {
  error_log('mail() a renvoyé false dans pool.php');
  http_response_code(500);
  echo json_encode([
    'ok' => false,
    'error' => $DEBUG ? 'mail() failed' : "L'envoi a échoué. Réessaie plus tard."
  ]);
}