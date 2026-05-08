
-- Устанавливаем правильный sha256-хеш пароля "admin2024"
-- sha256("admin2024") = 7b3d979ca8330a94fa7e9e1b466d8b99e0bcdea1ec90596c0dcc8d7ef6b4300c
INSERT INTO settings (key, value)
VALUES ('admin_password_hash', '7b3d979ca8330a94fa7e9e1b466d8b99e0bcdea1ec90596c0dcc8d7ef6b4300c')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
