<?php
// Перевірка, чи користувач прийшов з демо
session_start();
if (!isset($_SESSION['demo_completed']) || $_SESSION['demo_completed'] !== true) {
    header('Location: /chat/');
    exit;
}
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1, maximum-scale=1" name="viewport">
    <title>InvestGPT — Заповніть форму</title>
    <link href="css/flow.css" rel="stylesheet">
    <link href="css/funnel.css" rel="stylesheet">
    <link href="css/15_intlTelInput.css" rel="stylesheet">
    <link href="images/favicon.ico" rel="shortcut icon" type="image/x-icon">
</head>
<body>
    <div class="container">
        <header>
            <h1>Останній крок</h1>
            <p>Залиште свої контакти для отримання персональної консультації</p>
        </header>
        
        <form id="contact-form" method="post" action="process.php">
            <div class="form-group">
                <input type="text" name="name" id="name" required placeholder="Ім'я">
            </div>
            <div class="form-group">
                <input type="text" name="last" id="last" required placeholder="Прізвище">
            </div>
            <div class="form-group">
                <input type="email" name="email" id="email" required placeholder="Email">
            </div>
            <div class="form-group">
                <input type="tel" name="phone" id="phone" required>
            </div>
            <!-- Hidden fields will be populated by handoff.js -->
            <div id="hidden-fields"></div>
            <button type="submit" class="submit-btn">Отримати консультацію</button>
        </form>
        
        <footer>
            <small>Ваші дані захищено. <a href="privacy/">Політика конфіденційності</a></small>
        </footer>
    </div>

    <script src="js/jquery-3.4.1.min.js"></script>
    <script src="js/jquery.validate.min.js"></script>
    <script src="js/intlTelInput.js"></script>
    <script src="js/phone_code.js"></script>
    <script src="js/handoff.js"></script>
</body>
</html>