
# 🧹 Instrucciones de Limpieza Manual - 30 de octubre de 2025

## ⚠️ Nota Importante

Por políticas de seguridad del sistema, **no puedo eliminar directorios automáticamente**.

Debes ejecutar los comandos de limpieza **manualmente desde tu terminal**.

---

## 📋 Comandos de Limpieza

### Copia y ejecuta estos comandos en tu terminal:

```bash
cd /home/ubuntu

# Eliminar directorios antiguos (2.4 GB)
rm -rf escalafin_mvp_temp
rm -rf escalafin_mvp_BACKUP_20250923_042311
rm -rf escalafin_clean

# Eliminar backups .tar.gz antiguos (1 GB)
rm -f escalafin_backup_before_cleanup_20251029_053558.tar.gz
rm -f escalafin_mvp_backup_20251029_064541.tar.gz
rm -f escalafin_mvp_backup_20251029_064517.tar.gz

# Verificar limpieza
echo "✅ Limpieza completada"
ls -lhd escalafin* | grep -E "^d"
```

---

## 🎯 Qué se Elimina

### Directorios Antiguos (Total: ~2.4 GB)

| Directorio | Tamaño | Fecha | Razón |
|-----------|--------|-------|-------|
| `escalafin_mvp_temp` | 1.2 GB | 24 sept | Temporal antigua (1+ mes) |
| `escalafin_mvp_BACKUP_20250923_042311` | 836 MB | 23 sept | Backup antiguo (1+ mes) |
| `escalafin_clean` | 398 MB | 28 oct | Versión "limpia" antigua |

### Backups Comprimidos (Total: ~1 GB)

| Archivo | Tamaño | Fecha | Razón |
|---------|--------|-------|-------|
| `escalafin_backup_before_cleanup_*.tar.gz` | 579 MB | 29 oct | Desactualizado |
| `escalafin_mvp_backup_*.tar.gz` (x2) | 433 MB | 29 oct | Desactualizados |

---

## ✅ Seguridad

**Es 100% seguro eliminar estos archivos porque:**

1. ✅ Todo está en GitHub: https://github.com/qhosting/escalafin
2. ✅ El directorio actual `escalafin_mvp` tiene todos los cambios
3. ✅ Los backups son de hace días/semanas (ya obsoletos)
4. ✅ GitHub es el respaldo oficial (commit `c7fe23d`)

---

## 📊 Resultado Esperado

### Antes:
```
/home/ubuntu/
├── escalafin_mvp/           (736 MB) ✅ ACTIVO
├── escalafin_mvp_temp/      (1.2 GB) ❌
├── escalafin_mvp_BACKUP/    (836 MB) ❌
├── escalafin_clean/         (398 MB) ❌
└── *.tar.gz                 (1 GB)   ❌

Total: ~4.1 GB
```

### Después:
```
/home/ubuntu/
└── escalafin_mvp/           (736 MB) ✅ ÚNICO

Total: 736 MB
Espacio recuperado: ~3.4 GB ✅
```

---

## 🚀 Verificación Post-Limpieza

Después de ejecutar los comandos, verifica:

```bash
# Ver solo directorios escalafin*
ls -lhd /home/ubuntu/escalafin* | grep "^d"

# Debería mostrar SOLO:
drwxr-xr-x escalafin_mvp/

# Ver espacio recuperado
du -sh /home/ubuntu/escalafin_mvp
# Debería mostrar: 736M
```

---

## 📝 Resumen

| Acción | Comando | Espacio |
|--------|---------|---------|
| Eliminar `escalafin_mvp_temp` | `rm -rf escalafin_mvp_temp` | 1.2 GB |
| Eliminar `escalafin_mvp_BACKUP_20250923_042311` | `rm -rf escalafin_mvp_BACKUP_20250923_042311` | 836 MB |
| Eliminar `escalafin_clean` | `rm -rf escalafin_clean` | 398 MB |
| Eliminar backups .tar.gz | `rm -f escalafin_backup*.tar.gz escalafin_mvp_backup*.tar.gz` | 1 GB |
| **TOTAL RECUPERADO** | | **~3.4 GB** |

---

## ⚡ Comando Rápido (Todo en Uno)

Si quieres ejecutar todo de una vez:

```bash
cd /home/ubuntu && \
rm -rf escalafin_mvp_temp escalafin_mvp_BACKUP_20250923_042311 escalafin_clean && \
rm -f escalafin_backup_before_cleanup_20251029_053558.tar.gz \
      escalafin_mvp_backup_20251029_064541.tar.gz \
      escalafin_mvp_backup_20251029_064517.tar.gz && \
echo "✅ Limpieza completada - $(du -sh escalafin_mvp 2>/dev/null || echo '~736M') en uso"
```

---

## 🛡️ ¿Y si algo sale mal?

**No hay problema**, porque:

- ✅ GitHub tiene TODO: https://github.com/qhosting/escalafin
- ✅ Puedes clonar de nuevo en cualquier momento
- ✅ Solo estás eliminando copias locales antiguas
- ✅ El directorio activo (`escalafin_mvp`) NO se toca

---

**Directorio actual protegido:** `/home/ubuntu/escalafin_mvp` ✅  
**Respaldo en GitHub:** https://github.com/qhosting/escalafin ✅  
**Todo está seguro** ✅
