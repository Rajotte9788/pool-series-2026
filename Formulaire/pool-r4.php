<?php
header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/pool-error.log');

$DEBUG = false;

const FROM_ADDR = 'info@grinformatique.com';
const FROM_NAME = 'GR Informatique';

$RECIPIENTS = [
  'jonathanrajotte@hotmail.com' => 'Jonathan',
];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Méthode non autorisée']);
  exit;
}

if (!empty($_POST['website'] ?? '')) {
  echo json_encode(['ok' => true]);
  exit;
}

$participant = trim($_POST['participantName'] ?? '');
$enableSecondEntry = !empty($_POST['enableSecondEntry']);

if ($participant === '') {
  http_response_code(422);
  echo json_encode(['ok' => false, 'error' => 'Le nom du participant est requis.']);
  exit;
}

$subject = 'Nouvelle prédiction - Finale du pool';

$body  = "Nouvelle prédiction reçue - FINALE\n\n";
$body .= "Participant : {$participant}\n";
$body .= "2e entrée : " . ($enableSecondEntry ? 'Oui' : 'Non') . "\n\n";

$body .= "===== ENTRÉE 1 =====\n\n";

$body .= "Échange de joueur - Entrée 1 :\n";
$old = trim($_POST["entry1_exchange_old"] ?? '');
$new = trim($_POST["entry1_exchange_new"] ?? '');

if ($old !== '' || $new !== '') {
  $body .= "Joueur remplacé : " . ($old !== '' ? $old : '-') . "\n";
  $body .= "Nouveau joueur : " . ($new !== '' ? $new : '-') . "\n";
} else {
  $body .= "Aucun échange demandé.\n";
}

$body .= "\nPrédiction finale - Entrée 1 :\n";
for ($i = 1; $i <= 1; $i++) {
  $winner = trim($_POST["entry1_series{$i}_winner"] ?? '');
  $games  = trim($_POST["entry1_series{$i}_games"] ?? '');

  $body .= "Finale : " . ($winner !== '' ? $winner : '-') . " en " . ($games !== '' ? $games : '-') . " matchs\n";
}

if ($enableSecondEntry) {
  $body .= "\n\n===== ENTRÉE 2 =====\n\n";

  $body .= "Échange de joueur - Entrée 2 :\n";
  $old = trim($_POST["entry2_exchange_old"] ?? '');
  $new = trim($_POST["entry2_exchange_new"] ?? '');

  if ($old !== '' || $new !== '') {
    $body .= "Joueur remplacé : " . ($old !== '' ? $old : '-') . "\n";
    $body .= "Nouveau joueur : " . ($new !== '' ? $new : '-') . "\n";
  } else {
    $body .= "Aucun échange demandé.\n";
  }

  $body .= "\nPrédiction finale - Entrée 2 :\n";
  for ($i = 1; $i <= 1; $i++) {
    $winner = trim($_POST["entry2_series{$i}_winner"] ?? '');
    $games  = trim($_POST["entry2_series{$i}_games"] ?? '');

    $body .= "Finale : " . ($winner !== '' ? $winner : '-') . " en " . ($games !== '' ? $games : '-') . " matchs\n";
  }
}

$headers = [];
$headers[] = 'From: ' . FROM_NAME . ' <' . FROM_ADDR . '>';
$headers[] = 'Reply-To: ' . FROM_NAME . ' <' . FROM_ADDR . '>';
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'X-Mailer: PHP/' . phpversion();

$headers_str = implode("\r\n", $headers);

$to_list = [];

foreach ($RECIPIENTS as $addr => $name) {
  $addr = trim($addr);

  if ($addr !== '' && filter_var($addr, FILTER_VALIDATE_EMAIL)) {
    $to_list[] = $name ? "\"" . addslashes($name) . "\" <{$addr}>" : $addr;
  }
}

if (empty($to_list)) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Aucun destinataire valide configuré.']);
  exit;
}

$to = implode(', ', $to_list);
$additional_params = '-f' . FROM_ADDR;

$ok = @mail($to, $subject, $body, $headers_str, $additional_params);

$csv_line = [
  date('c'),
  'FINALE',
  $participant,
  ($enableSecondEntry ? 'Oui' : 'Non'),
  $old ?? '',
  $new ?? '',
  ($ok ? 'OK' : 'FAIL')
];

@file_put_contents(__DIR__ . '/pool-r4-submissions.csv', implode(';', $csv_line) . PHP_EOL, FILE_APPEND);

if ($ok) {
  echo json_encode(['ok' => true]);
} else {
  error_log('mail() a renvoyé false dans pool-r4.php');

  http_response_code(500);
  echo json_encode([
    'ok' => false,
    'error' => $DEBUG ? 'mail() failed' : "L'envoi a échoué. Réessaie plus tard."
  ]);
}