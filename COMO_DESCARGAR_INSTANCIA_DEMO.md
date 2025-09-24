
# 📦 Cómo Descargar y Desplegar la Instancia DEMO

## 📁 **Ubicación de Archivos**

Los archivos de la instancia DEMO están ahora disponibles en:

- **📂 Carpeta completa:** `/home/ubuntu/escalafin_mvp/instances/demo/`
- **📦 Archivo comprimido:** `/home/ubuntu/escalafin_mvp/escalafin-demo-instance.tar.gz`

---

## 💾 **Opciones de Descarga**

### **A) Archivo Comprimido (Recomendado)**
**Archivo:** `escalafin-demo-instance.tar.gz` (170MB)
**Ubicación:** `/home/ubuntu/escalafin_mvp/escalafin-demo-instance.tar.gz`

**Contiene:** Todo lo necesario para desplegar la instancia demo

### **B) Archivos Individuales Esenciales**
Si prefieres descargar solo los archivos clave:

1. **`.env.demo`** - Variables de entorno (803 bytes)
2. **`docker-compose.demo.yml`** - Configuración Docker (2.2K)
3. **`deploy-demo.sh`** - Script de despliegue (3.3K)
4. **`INSTRUCCIONES_DESPLIEGUE_MANUAL.md`** - Guía (4.3K)

---

## 🚀 **Pasos para Usar los Archivos**

### **1. Descargar desde ChatLLM**
- Usa el botón **"Files"** en la esquina superior derecha
- Descarga `escalafin-demo-instance.tar.gz` o los archivos individuales

### **2. Subir a tu Servidor**
```bash
# Opción A: Archivo completo
scp escalafin-demo-instance.tar.gz root@adm.escalafin.com:/tmp/

# Opción B: Carpeta completa (si descargaste archivos individuales)
scp -r demo/ root@adm.escalafin.com:/opt/coolify/instances/
```

### **3. Desplegar en el Servidor**
```bash
# Conectar al servidor
ssh root@adm.escalafin.com

# Si usaste archivo comprimido:
cd /tmp
tar -xzf escalafin-demo-instance.tar.gz
mv demo /opt/coolify/instances/

# Desplegar
cd /opt/coolify/instances/demo
export $(cat .env.demo | xargs)
docker-compose -f docker-compose.demo.yml up -d --build
```

---

## 🌐 **URLs Finales**

Una vez desplegado:
- **🏠 Aplicación:** https://demo.escalafin.com
- **⚙️ Admin:** https://demo.escalafin.com/admin
- **🔗 Directo:** http://adm.escalafin.com:3001

---

## 👤 **Credenciales de Prueba**
- **Admin:** admin@escalafin.com / admin123
- **Asesor:** asesor1@escalafin.com / asesor123

---

## 🔧 **Configuración DNS**

Agregar en tu DNS:
```
demo.escalafin.com A adm.escalafin.com
```

---

## ✅ **Verificación**

Después del despliegue, verifica:
```bash
# Estado de contenedores
docker-compose -f docker-compose.demo.yml ps

# Health check
curl http://localhost:3001/api/health
```

---

**🎉 ¡Tu instancia DEMO estará lista para usar!**
