#!/usr/bin/env node
/**
 * scripts/asterisk/agi-condusef-check.js
 *
 * Script AGI (Asterisk Gateway Interface) — Verificador CONDUSEF
 * Consulta la API de Escalafin para determinar si un número de teléfono
 * pertenece a una referencia personal (prohibido contactar por CONDUSEF).
 *
 * Parámetros recibidos desde el dialplan:
 *   ARG1 = Teléfono a verificar
 *   ARG2 = URL base del API de Escalafin (ej: https://app.escalafin.com)
 *   ARG3 = Token de API (Bearer)
 *   ARG4 = ID del cliente (para contexto del tenant)
 *
 * Variables de canal que establece:
 *   CONDUSEF_IS_REFERENCE = "YES" | "NO"
 *   CONDUSEF_CHECK_ERROR  = "YES" | "NO" (si hubo error de API)
 *
 * Instalación en Asterisk:
 *   cp agi-condusef-check.js /var/lib/asterisk/agi-bin/
 *   chmod +x /var/lib/asterisk/agi-bin/agi-condusef-check.js
 *   npm install node-fetch (o usar Node.js 18+ con fetch nativo)
 */

'use strict';

const readline = require('readline');
const https    = require('https');
const http     = require('http');

// ─── Interface AGI ────────────────────────────────────────────────────────────

const rl = readline.createInterface({
  input:  process.stdin,
  output: process.stdout,
  terminal: false,
});

const lines  = [];
let   ready  = false;

// Leer el header AGI de Asterisk
rl.on('line', (line) => {
  if (!ready) {
    if (line === '') {
      // Header AGI completo, parsear variables
      ready = true;
      runCheck();
    } else {
      lines.push(line);
    }
  }
});

// ─── Parser del header AGI ────────────────────────────────────────────────────

function parseAgiVars(lines) {
  const vars = {};
  for (const line of lines) {
    const match = line.match(/^agi_(\w+):\s(.+)$/);
    if (match) vars[match[1]] = match[2];
  }
  return vars;
}

// ─── Comunicación AGI ─────────────────────────────────────────────────────────

function sendCommand(cmd) {
  process.stdout.write(cmd + '\n');
}

function setVar(name, value) {
  sendCommand(`SET VARIABLE ${name} "${value}"`);
}

function hangup() {
  sendCommand('HANGUP');
}

function exitAgi() {
  process.exit(0);
}

// ─── Lógica principal ─────────────────────────────────────────────────────────

async function runCheck() {
  const vars     = parseAgiVars(lines);
  const phone    = vars['arg1'] || '';
  const apiUrl   = vars['arg2'] || '';
  const apiToken = vars['arg3'] || '';
  const clientId = vars['arg4'] || '';

  console.error(`[AGI-CONDUSEF] Verificando teléfono: ${phone} para cliente: ${clientId}`);

  if (!phone || !apiUrl || !apiToken) {
    console.error('[AGI-CONDUSEF] Parámetros insuficientes. Fallando de forma segura (NO = permitir).');
    setVar('CONDUSEF_IS_REFERENCE', 'NO');
    setVar('CONDUSEF_CHECK_ERROR', 'YES');
    exitAgi();
    return;
  }

  try {
    // Consultar la API de Escalafin
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const endpoint   = `${apiUrl}/api/condusef/check-reference?phone=${cleanPhone}&clientId=${clientId}`;

    const result = await httpGet(endpoint, apiToken);

    if (result.isReference === true) {
      console.error(`[AGI-CONDUSEF] ⚠️  REFERENCIA DETECTADA: ${phone}. Bloqueando llamada.`);
      setVar('CONDUSEF_IS_REFERENCE', 'YES');
      setVar('CONDUSEF_CHECK_ERROR',  'NO');
    } else {
      console.error(`[AGI-CONDUSEF] ✅ Número ${phone} es del titular. Permitiendo llamada.`);
      setVar('CONDUSEF_IS_REFERENCE', 'NO');
      setVar('CONDUSEF_CHECK_ERROR',  'NO');
    }

  } catch (error) {
    // Error de API — fail-open (permitir la llamada) para no bloquear operaciones
    // En un entorno estricto, cambiar a fail-closed (bloquear)
    console.error(`[AGI-CONDUSEF] Error consultando API: ${error.message}`);
    setVar('CONDUSEF_IS_REFERENCE', 'NO');
    setVar('CONDUSEF_CHECK_ERROR',  'YES');
  }

  exitAgi();
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

function httpGet(url, token) {
  return new Promise((resolve, reject) => {
    const lib     = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept':        'application/json',
        'User-Agent':    'Escalafin-AGI/1.0',
      },
      timeout: 5000, // 5 segundos máximo
    };

    const req = lib.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Respuesta no JSON: ${data.substring(0, 100)}`));
        }
      });
    });

    req.on('timeout', () => {
      req.abort();
      reject(new Error('Timeout consultando API'));
    });

    req.on('error', reject);
  });
}
