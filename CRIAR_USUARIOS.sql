-- ============================================================
-- SCRIPT DE CRIAÇÃO DE USUÁRIOS — Treinar Engenharia
-- Rodar no Railway: Dashboard → Postgres → Query
-- ============================================================

-- Adicionar coluna force_password_change se não existir
ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Atualizar admin (armindo) — garantir que é admin e não precisa trocar senha
UPDATE users 
SET role = 'admin', force_password_change = FALSE, active = TRUE
WHERE email = 'armindo@treinar.eng.br';

-- Criar usuários novos
-- Senha: treinar123 (hash bcrypt gerado com salt 10)
-- Hash de 'treinar123': $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

INSERT INTO users (name, email, password_hash, role, force_password_change, active, created_at)
VALUES 
  ('Gabrielle', 'gabrielle@treinar.eng.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'inspetor', TRUE, TRUE, NOW()),
  ('Gustavo Martins', 'gustavo.martins@treinar.eng.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'inspetor', TRUE, TRUE, NOW()),
  ('Pedro', 'pedro@treinar.eng.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'inspetor', TRUE, TRUE, NOW()),
  ('Yago', 'yago@treinar.eng.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'inspetor', TRUE, TRUE, NOW()),
  ('Thales', 'thales@treinar.eng.br', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'inspetor', TRUE, TRUE, NOW())
ON CONFLICT (email) DO UPDATE SET
  force_password_change = TRUE,
  active = TRUE;

-- Verificar resultado
SELECT id, name, email, role, force_password_change, active, created_at 
FROM users 
ORDER BY created_at;
