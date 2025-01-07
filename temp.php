<?php
require __DIR__ . '/default/vendor/autoload.php';
$app = require_once __DIR__ . '/default/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    <?php
//write your code here


$user = User::find(1);

echo $user->name;
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
