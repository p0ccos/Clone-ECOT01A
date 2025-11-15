// src/db.js (VERSÃO FINAL)
const { Pool } = require('pg');
require('dotenv').config(); // Carrega o .env (para desenvolvimento local)

// 1. Configuração base, lê a URL do banco
const config = {
  connectionString: process.env.DATABASE_URL, 
};

// 2. Adiciona configuração SSL APENAS se estiver em produção (no Render)
if (process.env.NODE_ENV === 'production') {
  config.ssl = {
    rejectUnauthorized: false 
  };
}

// 3. Cria o pool com a configuração correta (local ou produção)
const pool = new Pool(config);

module.exports = pool;