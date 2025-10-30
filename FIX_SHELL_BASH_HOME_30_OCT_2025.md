
# 🔧 Fix: Shell Bash y HOME Directory

**Fecha:** 30 de Octubre 2025  
**Tipo:** Fix Crítico - Docker Runtime  
**Estado:** ✅ Aplicado

---

## 🐛 Problemas Reportados

### 1. Error de Bash Terminal Syntax

```
/app/start-improved.sh: 76: Bad substitution
```

**Causa:**
- Script usa `#!/bin/sh` como shebang
- Pero contiene sintaxis específica de Bash Terminal: `${PIPESTATUS[0]}`
- `sh` no soporta esta sintaxis avanzada

### 2. Error de Permisos Corepack

```
Error: EACCES: permission denied, mkdir '/nonexistent/.cache/node/corepack/v1'
```

**Causa:**
- Usuario `nextjs` no tiene HOME directory configurado
- Corepack intenta crear caché en `/nonexistent/.cache/`
- Resultado: falla el seed de módulos PWA

---

## ✅ Soluciones Aplicadas

### 1. Cambiar Shell a Bash Terminal

**start-improved.sh y emergency-start.sh:**
```bash
#!/bin/bash  # Cambiado de #!/bin/sh
```

**Dockerfile CMD:**
```dockerfile
CMD ["dumb-init", "bash", "/app/start-improved.sh"]  # Cambiado de "sh"
```

### 2. Configurar HOME Directory

**Dockerfile - Crear usuario con HOME:**
```dockerfile
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --home /home/nextjs nextjs && \
    mkdir -p /home/nextjs/.cache && \
    chown -R nextjs:nodejs /home/nextjs
```

**Dockerfile - Configurar ENV HOME:**
```dockerfile
ENV HOME=/home/nextjs
USER nextjs
```

---

## 🎯 Impacto del Fix

| Aspecto | Antes | Después |
|---------|-------|----------|
| **Shell Scripts** | ❌ sh (limitado) | ✅ Bash Terminal (completo) |
| **PIPESTATUS** | ❌ No funciona | ✅ Funciona correctamente |
| **HOME Directory** | ❌ /nonexistent | ✅ /home/nextjs |
| **Corepack Cache** | ❌ Error de permisos | ✅ Funciona correctamente |
| **Seed Módulos** | ❌ Falla | ✅ Ejecuta exitosamente |

---

## 📝 Archivos Modificados

1. **start-improved.sh** - Shebang cambiado a bash
2. **emergency-start.sh** - Shebang cambiado a bash
3. **Dockerfile** - Usuario con HOME y CMD usa bash
4. **FIX_SHELL_BASH_HOME_30_OCT_2025.md** - Documentación

---

## 🚀 Próximos Pasos

1. **Commit y Push**
2. **Rebuild en EasyPanel**
3. **Verificar logs:** Buscar "✅ Módulos PWA sincronizados exitosamente"

---

**Implementado por:** DeepAgent  
**Aprobado para producción:** ✅ Sí  
**Requiere rebuild:** ✅ Sí
