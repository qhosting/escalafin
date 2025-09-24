# 📊 Resultados de Testing Manual - EscalaFin MVP

> **Fecha**: 24/09/2025 05:04:41  
> **Sistema**: EscalaFin v2.0.0  
> **Tipo**: Testing Manual con Scripts  
> **Base URL**: http://localhost:3000

### Health Check API
**Estado**: ✅ PASS  
**Timestamp**: 2025-09-24 05:04:42  
**Detalles**: {"status":"healthy","timestamp":"2025-09-24T05:04:42.219Z","version":"1.0.0","environment":"development","database":"connected","uptime":129.14771057}

### Página Principal
**Estado**: ✅ PASS  
**Timestamp**: 2025-09-24 05:04:50  
**Detalles**: Página principal cargada correctamente

### Auth Providers API
**Estado**: ✅ PASS  
**Timestamp**: 2025-09-24 05:04:55  
**Detalles**: {"credentials":{"id":"credentials","name":"credentials","type":"credentials","signinUrl":"https://e80ee4719.preview.abacusai.app/api/auth/signin/credentials","callbackUrl":"https://e80ee4719.preview.abacusai.app/api/auth/callback/credentials"}}

### Página de Login
**Estado**: ✅ PASS  
**Timestamp**: 2025-09-24 05:04:56  
**Detalles**: Página de login cargada correctamente

### API /api/health
**Estado**: ✅ PASS  
**Timestamp**: 2025-09-24 05:04:56  
**Detalles**: {"status":"healthy","timestamp":"2025-09-24T05:04:56.272Z","version":"1.0.0","environment":"development","database":"connected","uptime":143.200638593}

### API /api/auth/providers
**Estado**: ✅ PASS  
**Timestamp**: 2025-09-24 05:04:56  
**Detalles**: {"credentials":{"id":"credentials","name":"credentials","type":"credentials","signinUrl":"https://e80ee4719.preview.abacusai.app/api/auth/signin/credentials","callbackUrl":"https://e80ee4719.preview.abacusai.app/api/auth/callback/credentials"}}

### API /api/auth/csrf
**Estado**: ✅ PASS  
**Timestamp**: 2025-09-24 05:04:56  
**Detalles**: {"csrfToken":"85c435fefa4051528e2433cc92f279736d8a103f5433218c51e80ee82178243d"}

### API Protegida /api/admin/users
**Estado**: ✅ PASS  
**Timestamp**: 2025-09-24 05:04:57  
**Detalles**: API correctamente protegida: HTTP 404: <!DOCTYPE html><html lang="es"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1758690297081" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=1758690297081"/><script src="/_next/static/chunks/main-app.js?v=1758690297081" async=""></script><script src="/_next/static/chunks/app-pages-internals.js" async=""></script><script src="/_next/static/chunks/app/layout.js" async=""></script><meta name="robots" content="noindex"/><meta name="theme-color" content="#2563eb"/><title>EscalaFin - Sistema de Gestión de Créditos</title><meta name="description" content="Plataforma completa para la gestión de préstamos y créditos"/><link rel="manifest" href="/manifest.json" crossorigin="use-credentials"/><meta name="next-size-adjust"/><script src="/_next/static/chunks/polyfills.js" noModule=""></script></head><body class="__className_f367f3"><script>!function(){try{var d=document.documentElement,c=d.classList;c.remove('light','dark');var e=localStorage.getItem('theme');if('system'===e||(!e&&false)){var t='(prefers-color-scheme: dark)',m=window.matchMedia(t);if(m.media!==t||m.matches){d.style.colorScheme = 'dark';c.add('dark')}else{d.style.colorScheme = 'light';c.add('light')}}else if(e){c.add(e|| '')}else{c.add('light')}if(e==='light'||e==='dark'||!e)d.style.colorScheme=e||'light'}catch(e){}}()</script><div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div class="text-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div><p class="text-gray-600 dark:text-gray-300">Cargando...</p></div></div><script src="/_next/static/chunks/webpack.js?v=1758690297081" async=""></script><script>(self.__next_f=self.__next_f||[]).push([0]);self.__next_f.push([2,null])</script><script>self.__next_f.push([1,"1:HL[\"/_next/static/media/e4af272ccee01ff0-s.p.woff2\",\"font\",{\"crossOrigin\":\"\",\"type\":\"font/woff2\"}]\n2:HL[\"/_next/static/css/app/layout.css?v=1758690297081\",\"style\"]\n0:D{\"name\":\"r2\",\"env\":\"Server\"}\n"])</script><script>self.__next_f.push([1,"3:I[\"(app-pages-browser)/./node_modules/next/dist/client/components/app-router.js\",[\"app-pages-internals\",\"static/chunks/app-pages-internals.js\"],\"\"]\n6:I[\"(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js\",[\"app-pages-internals\",\"static/chunks/app-pages-internals.js\"],\"\"]\n7:I[\"(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js\",[\"app-pages-internals\",\"static/chunks/app-pages-internals.js\"],\"\"]\n9:I[\"(app-pages-browser)/./app/providers.tsx\",[\"app/layout\",\"static/chunks/app/layout.js\"],\"Providers\"]\na:I[\"(app-pages-browser)/./components/layout/main-layout.tsx\",[\"app/layout\",\"static/chunks/app/layout.js\"],\"MainLayout\"]\n10:I[\"(app-pages-browser)/./node_modules/sonner/dist/index.mjs\",[\"app/layout\",\"static/chunks/app/layout.js\"],\"Toaster\"]\n13:I[\"(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js\",[\"app-pages-internals\",\"static/chunks/app-pages-internals.js\"],\"\"]\n4:D{\"name\":\"\",\"env\":\"Server\"}\n5:D{\"name\":\"NotFound\",\"env\":\"Server\"}\n5:[[\"$\",\"title\",null,{\"children\":\"404: This page could not be found.\"}],[\"$\",\"div\",null,{\"style\":{\"fontFamily\":\"system-ui,\\\"Segoe UI\\\",Roboto,Helvetica,Arial,sans-serif,\\\"Apple Color Emoji\\\",\\\"Segoe UI Emoji\\\"\",\"height\":\"100vh\",\"textAlign\":\"center\",\"display\":\"flex\",\"flexDirection\":\"column\",\"alignItems\":\"center\",\"justifyContent\":\"center\"},\"children\":[\"$\",\"div\",null,{\"children\":[[\"$\",\"style\",null,{\"dangerouslySetInnerHTML\":{\"__html\":\"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}\"}}],[\"$\",\"h1\",null,{\"className\":\"next-error-h1\",\"style\":{\"display\":\"inline-block\",\"margin\":\"0 20px 0 0\",\"padding\":\"0 23px 0 0\",\"fontSize\":24,\"fontWeight\":500,\"verticalAlign\":\"top\",\"lineHeight\":\"49px\"},\"children\":\"404\"}],[\"$\",\"div\",null,{\"style\":{\"display\":\"inline-block\"},\"children\":[\"$\",\"h2\",null,{\"style\":{\"fontSize\":14,\"fontWeight\":400,\"lineHeight\""])</script><script>self.__next_f.push([1,":\"49px\",\"margin\":0},\"children\":\"This page could not be found.\"}]}]]}]}]]\n8:D{\"name\":\"RootLayout\",\"env\":\"Server\"}\nb:D{\"name\":\"NotFound\",\"env\":\"Server\"}\nc:{\"fontFamily\":\"system-ui,\\\"Segoe UI\\\",Roboto,Helvetica,Arial,sans-serif,\\\"Apple Color Emoji\\\",\\\"Segoe UI Emoji\\\"\",\"height\":\"100vh\",\"textAlign\":\"center\",\"display\":\"flex\",\"flexDirection\":\"column\",\"alignItems\":\"center\",\"justifyContent\":\"center\"}\nd:{\"display\":\"inline-block\",\"margin\":\"0 20px 0 0\",\"padding\":\"0 23px 0 0\",\"fontSize\":24,\"fontWeight\":500,\"verticalAlign\":\"top\",\"lineHeight\":\"49px\"}\ne:{\"display\":\"inline-block\"}\nf:{\"fontSize\":14,\"fontWeight\":400,\"lineHeight\":\"49px\",\"margin\":0}\nb:[[\"$\",\"title\",null,{\"children\":\"404: This page could not be found.\"}],[\"$\",\"div\",null,{\"style\":\"$c\",\"children\":[\"$\",\"div\",null,{\"children\":[[\"$\",\"style\",null,{\"dangerouslySetInnerHTML\":{\"__html\":\"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}\"}}],[\"$\",\"h1\",null,{\"className\":\"next-error-h1\",\"style\":\"$d\",\"children\":\"404\"}],[\"$\",\"div\",null,{\"style\":\"$e\",\"children\":[\"$\",\"h2\",null,{\"style\":\"$f\",\"children\":\"This page could not be found.\"}]}]]}]}]]\n8:[\"$\",\"html\",null,{\"lang\":\"es\",\"children\":[[\"$\",\"head\",null,{\"children\":[\"$\",\"meta\",null,{\"name\":\"viewport\",\"content\":\"width=device-width, initial-scale=1, maximum-scale=1\"}]}],[\"$\",\"body\",null,{\"className\":\"__className_f367f3\",\"children\":[\"$\",\"$L9\",null,{\"children\":[[\"$\",\"$La\",null,{\"children\":[\"$\",\"$L6\",null,{\"parallelRouterKey\":\"children\",\"segmentPath\":[\"children\"],\"error\":\"$undefined\",\"errorStyles\":\"$undefined\",\"errorScripts\":\"$undefined\",\"template\":[\"$\",\"$L7\",null,{}],\"templateStyles\":\"$undefined\",\"templateScripts\":\"$undefined\",\"notFound\":\"$b\",\"notFoundStyles\":[]}]}],[\"$\",\"$L10\",null,{\"position\":\"top-right\",\"richColors\":true,\"closeButton\":true,\"theme\":\"light\"}]]}]}]]}]\n11:D{\"name\":\"rQ\",\"env\":\"Server\"}\n11:[\"$\",\"meta\",null,{\"name\":\"robots\",\"content\":\"noindex\"}]\n12:D{\"name\""])</script><script>self.__next_f.push([1,":\"\",\"env\":\"Server\"}\n14:[]\n0:[\"$\",\"$L3\",null,{\"buildId\":\"development\",\"assetPrefix\":\"\",\"urlParts\":[\"\",\"api\",\"admin\",\"users\"],\"initialTree\":[\"\",{\"children\":[\"/_not-found\",{\"children\":[\"__PAGE__\",{}]}]},\"$undefined\",\"$undefined\",true],\"initialSeedData\":[\"\",{\"children\":[\"/_not-found\",{\"children\":[\"__PAGE__\",{},[[\"$L4\",\"$5\",null],null],null]},[null,[\"$\",\"$L6\",null,{\"parallelRouterKey\":\"children\",\"segmentPath\":[\"children\",\"/_not-found\",\"children\"],\"error\":\"$undefined\",\"errorStyles\":\"$undefined\",\"errorScripts\":\"$undefined\",\"template\":[\"$\",\"$L7\",null,{}],\"templateStyles\":\"$undefined\",\"templateScripts\":\"$undefined\",\"notFound\":\"$undefined\",\"notFoundStyles\":\"$undefined\"}]],null]},[[[[\"$\",\"link\",\"0\",{\"rel\":\"stylesheet\",\"href\":\"/_next/static/css/app/layout.css?v=1758690297081\",\"precedence\":\"next_static/css/app/layout.css\",\"crossOrigin\":\"$undefined\"}]],\"$8\"],null],null],\"couldBeIntercepted\":false,\"initialHead\":[\"$11\",\"$L12\"],\"globalErrorComponent\":\"$13\",\"missingSlots\":\"$W14\"}]\n"])</script><script>self.__next_f.push([1,"12:[[\"$\",\"meta\",\"0\",{\"name\":\"viewport\",\"content\":\"width=device-width, initial-scale=1, maximum-scale=1\"}],[\"$\",\"meta\",\"1\",{\"name\":\"theme-color\",\"content\":\"#2563eb\"}],[\"$\",\"meta\",\"2\",{\"charSet\":\"utf-8\"}],[\"$\",\"title\",\"3\",{\"children\":\"EscalaFin - Sistema de Gestión de Créditos\"}],[\"$\",\"meta\",\"4\",{\"name\":\"description\",\"content\":\"Plataforma completa para la gestión de préstamos y créditos\"}],[\"$\",\"link\",\"5\",{\"rel\":\"manifest\",\"href\":\"/manifest.json\",\"crossOrigin\":\"use-credentials\"}],[\"$\",\"meta\",\"6\",{\"name\":\"next-size-adjust\"}]]\n4:null\n"])</script></body></html>

### API Protegida /api/clients
**Estado**: ✅ PASS  
**Timestamp**: 2025-09-24 05:04:57  
**Detalles**: {"error":"No autorizado"}

### API Protegida /api/loans
**Estado**: ✅ PASS  
**Timestamp**: 2025-09-24 05:04:57  
**Detalles**: {"error":"No autorizado"}

### API Protegida /api/payments/transactions
**Estado**: ✅ PASS  
**Timestamp**: 2025-09-24 05:04:58  
**Detalles**: {"error":"Unauthorized"}

### Página /
**Estado**: ✅ PASS  
**Timestamp**: 2025-09-24 05:04:58  
**Detalles**: Página cargada correctamente

### Página /auth/login
**Estado**: ✅ PASS  
**Timestamp**: 2025-09-24 05:04:58  
**Detalles**: Página cargada correctamente

### Página /auth/register
**Estado**: ✅ PASS  
**Timestamp**: 2025-09-24 05:04:59  
**Detalles**: Página cargada correctamente

### Página /soporte
**Estado**: ❌ FAIL  
**Timestamp**: 2025-09-24 05:04:59  
**Detalles**: Error cargando página: HTTP 307: /api/auth/signin?callbackUrl=%2Fsoporte

### Página Protegida /admin/dashboard
**Estado**: ❌ FAIL  
**Timestamp**: 2025-09-24 05:04:59  
**Detalles**: Error: HTTP 307: /api/auth/signin?callbackUrl=%2Fadmin%2Fdashboard

### Página Protegida /admin/users
**Estado**: ❌ FAIL  
**Timestamp**: 2025-09-24 05:04:59  
**Detalles**: Error: HTTP 307: /api/auth/signin?callbackUrl=%2Fadmin%2Fusers

### Página Protegida /asesor/dashboard
**Estado**: ❌ FAIL  
**Timestamp**: 2025-09-24 05:04:59  
**Detalles**: Error: HTTP 307: /api/auth/signin?callbackUrl=%2Fasesor%2Fdashboard

### Página Protegida /cliente/dashboard
**Estado**: ❌ FAIL  
**Timestamp**: 2025-09-24 05:04:59  
**Detalles**: Error: HTTP 307: /api/auth/signin?callbackUrl=%2Fcliente%2Fdashboard


## 📊 Resumen de Resultados

| Categoría | Total | Exitosos | Fallidos | Parciales | % Éxito |
|-----------|-------|----------|----------|-----------|---------|
| **Total** | 19 | 14 | 5 | 0 | 73% |

### Estado General del Sistema
**⚠️ FUNCIONAL CON PROBLEMAS MENORES**

---
*Reporte generado automáticamente el Wed Sep 24 05:04:59 UTC 2025*
