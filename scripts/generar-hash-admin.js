// generar-hash-admin.js — Convierte una contrasena en su version encriptada (hash).
//
// Uso (en tu terminal, parado en la carpeta del proyecto):
//   node scripts/generar-hash-admin.js
//
// Te pide la contrasena, y te devuelve el hash para pegar en .env
// (en la variable ADMIN_PASSWORD_HASH). Tu contrasena real NO se guarda
// en ningun lado: solo se usa para calcular el hash y se descarta.

const readline = require('readline');
const bcrypt = require('bcryptjs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Escribi la contrasena del admin y apreta Enter: ', async (password) => {
  if (!password || password.trim() === '') {
    console.log('\nNo escribiste ninguna contrasena. Proba de nuevo.');
    rl.close();
    return;
  }

  const hash = await bcrypt.hash(password, 10);

  console.log('\n=====================================================');
  console.log('Tu hash (copialo COMPLETO y pegalo en .env, en ADMIN_PASSWORD_HASH):');
  console.log('\n' + hash + '\n');
  console.log('=====================================================');
  rl.close();
});
