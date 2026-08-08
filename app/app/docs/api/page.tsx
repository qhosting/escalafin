'use client';

/**
 * Portal Interactivo de Documentación API v1 (/docs/api)
 * EscalaFin v3.0.0 - UI/UX Pro Max Standard
 */

import React, { useState } from 'react';
import { 
  Code2, 
  KeyRound, 
  Terminal, 
  Copy, 
  Check, 
  ShieldCheck, 
  Layers, 
  ExternalLink,
  BookOpen
} from 'lucide-react';

export default function ApiDocsPage() {
  const [copied, setCopied] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('sk_live_demo_escalafin_123456');

  const curlExample = `curl -X GET "https://api.escalafin.com/api/v1/loans?status=ACTIVE&page=1&limit=10" \\
  -H "X-API-Key: ${apiKeyInput}" \\
  -H "Content-Type: application/json"`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(curlExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Hero */}
        <div className="space-y-4 border-b border-slate-800 pb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Code2 className="w-3.5 h-3.5" />
            <span>Developer Portal v1.0</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            EscalaFin Public API Documentation
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-3xl leading-relaxed">
            Integre la cartera de préstamos, tablas de amortizaciones y clientes de su organización directamente con sus sistemas ERP, herramientas de contabilidad o aplicaciones personalizadas.
          </p>
        </div>

        {/* Autenticación & API Keys */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-4">
            <div className="flex items-center space-x-3 text-indigo-400">
              <KeyRound className="w-5 h-5" />
              <h2 className="text-xl font-bold text-white">Autenticación por API Key</h2>
            </div>
            <p className="text-sm text-slate-300">
              Todas las peticiones a la API v1 requieren incluir su clave de acceso en la cabecera HTTP <code className="text-indigo-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">X-API-Key</code> o mediante un Bearer Token.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Su API Key (Simulación de Pruebas):
              </label>
              <input
                type="text"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-900/50 backdrop-blur-xl space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold text-white text-base">Seguridad & Limites</h3>
            </div>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Rate Limit: 1,000 peticiones / minuto</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>TLS 1.3 con Cifrado de extremo a extremo</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Aislamiento estricto por TenantId</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Sección de Endpoints */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Layers className="w-6 h-6 text-indigo-400" />
              <span>Endpoints Disponibles (v1)</span>
            </h2>
            <a 
              href="/api/v1/docs" 
              target="_blank" 
              className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span>Ver OpenAPI 3.0 JSON</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Endpoint: GET /api/v1/loans */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                GET
              </span>
              <code className="text-lg font-mono text-white">/api/v1/loans</code>
              <span className="text-xs text-slate-400 font-medium">Consultar Cartera de Préstamos</span>
            </div>

            {/* cURL Code Block */}
            <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto">
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800/80 text-slate-500">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>cURL Command</span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-1 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              <pre className="text-emerald-400">{curlExample}</pre>
            </div>

            {/* Parámetros */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Parámetros de Consulta:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="font-mono font-bold text-indigo-300">status</span>
                  <span className="text-slate-500 ml-2">(opcional)</span>
                  <p className="text-slate-400 mt-1">ACTIVE, PAID_OFF, DEFAULTED. Por defecto: ACTIVE.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="font-mono font-bold text-indigo-300">page</span>
                  <span className="text-slate-500 ml-2">(opcional)</span>
                  <p className="text-slate-400 mt-1">Número de página. Por defecto: 1.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="font-mono font-bold text-indigo-300">limit</span>
                  <span className="text-slate-500 ml-2">(opcional)</span>
                  <p className="text-slate-400 mt-1">Resultados por página (máx. 100). Por defecto: 20.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
