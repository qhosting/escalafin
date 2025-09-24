
#!/bin/bash
# Script simple para desplegar instancia DEMO manualmente

echo "🚀 Desplegando instancia DEMO en adm.escalafin.com"
echo ""
echo "📋 PASOS A SEGUIR:"
echo ""
echo "1️⃣ Copiar archivos al servidor:"
echo 'scp -r /tmp/escalafin-instances/demo root@adm.escalafin.com:/opt/coolify/instances/'
echo ""
echo "2️⃣ Conectar al servidor:"
echo 'ssh root@adm.escalafin.com'
echo ""
echo "3️⃣ Ejecutar en el servidor:"
echo 'cd /opt/coolify/instances/demo'
echo 'export $(cat .env.demo | xargs)'
echo 'docker-compose -f docker-compose.demo.yml down || true'
echo 'docker-compose -f docker-compose.demo.yml up -d --build'
echo ""
echo "4️⃣ Verificar despliegue:"
echo 'docker-compose -f docker-compose.demo.yml ps'
echo 'curl http://localhost:3001/api/health'
echo ""
echo "🌐 URLs finales:"
echo "   - Aplicación: https://demo.escalafin.com"
echo "   - Directo: http://adm.escalafin.com:3001"
echo "   - Admin: https://demo.escalafin.com/admin"
echo ""
echo "👤 Credenciales de prueba:"
echo "   - Admin: admin@escalafin.com / admin123"
echo "   - Asesor: asesor1@escalafin.com / asesor123"
echo ""
echo "⚙️ Password SSH proporcionado: x0420EZS"
echo ""
echo "📄 Ver instrucciones completas en:"
echo "   /tmp/escalafin-instances/demo/INSTRUCCIONES_DESPLIEGUE_MANUAL.md"
