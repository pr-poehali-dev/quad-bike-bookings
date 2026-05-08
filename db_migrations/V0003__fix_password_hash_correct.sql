
-- sha256("admin2024") правильный хеш
UPDATE settings
SET value = encode(sha256('admin2024'::bytea), 'hex')
WHERE key = 'admin_password_hash';
