
#!/bin/bash

echo "🔐 Configuración SSH para GitHub - EscalaFin"
echo "=============================================="
echo

# Variables
EMAIL="escalafin@qhosting.com"
KEY_NAME="escalafin_github"
KEY_PATH="$HOME/.ssh/$KEY_NAME"

# Crear directorio .ssh si no existe
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 1. Verificar si ya existe una clave
if [ -f "$KEY_PATH" ]; then
    echo "⚠️  Ya existe una clave en: $KEY_PATH"
    read -p "¿Deseas generar una nueva? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "❌ Operación cancelada"
        echo "   Tu clave existente está en: $KEY_PATH.pub"
        cat "${KEY_PATH}.pub"
        exit 0
    fi
    mv "$KEY_PATH" "${KEY_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
    mv "${KEY_PATH}.pub" "${KEY_PATH}.pub.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Clave anterior respaldada"
fi

# 2. Generar nueva clave
echo "🔑 Generando nueva clave SSH..."
if command -v ssh-keygen >/dev/null 2>&1; then
    ssh-keygen -t ed25519 -C "$EMAIL" -f "$KEY_PATH" -N "" 2>/dev/null || \
    ssh-keygen -t rsa -b 4096 -C "$EMAIL" -f "$KEY_PATH" -N ""
    
    if [ $? -eq 0 ]; then
        echo "✅ Clave generada exitosamente!"
    else
        echo "❌ Error al generrar la clave"
        exit 1
    fi
else
    echo "❌ ssh-keygen no está instalado"
    echo "   Instálalo con: sudo apt-get install openssh-client"
    exit 1
fi

# 3. Configurar SSH
echo
echo "⚙️  Configurando SSH..."

# Backup de config existente
if [ -f ~/.ssh/config ]; then
    cp ~/.ssh/config ~/.ssh/config.backup.$(date +%Y%m%d_%H%M%S)
fi

# Crear o actualizar config
if grep -q "^Host github.com" ~/.ssh/config 2>/dev/null; then
    # Actualizar entrada existente
    sed -i "/^Host github.com/,/^Host/c\Host github.com\n    HostName github.com\n    User git\n    IdentityFile $KEY_PATH\n    IdentitiesOnly yes\n" ~/.ssh/config
else
    # Agregar nueva entrada
    cat >> ~/.ssh/config << EOF

Host github.com
    HostName github.com
    User git
    IdentityFile $KEY_PATH
    IdentitiesOnly yes
EOF
fi

# Permisos correctos
chmod 600 ~/.ssh/config
chmod 600 "$KEY_PATH"
chmod 644 "${KEY_PATH}.pub"

echo "✅ Configuración SSH completada"

# 4. Mostrar clave pública
echo
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║  📋 COPIA ESTA CLAVE Y AGRÉGALA A GITHUB                     ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo
cat "${KEY_PATH}.pub"
echo
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║  🔗 Agrégala aquí: https://github.com/settings/keys          ║"
echo "║                                                               ║"
echo "║  Pasos:                                                       ║"
echo "║  1. Abre el enlace arriba                                    ║"
echo "║  2. Click en 'New SSH key' (botón verde)                     ║"
echo "║  3. Title: EscalaFin Server                                  ║"
echo "║  4. Key type: Authentication Key                             ║"
echo "║  5. Key: Pega la clave de arriba                             ║"
echo "║  6. Click 'Add SSH key'                                      ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo

# 5. Esperar confirmación
read -p "Presiona Enter después de agregar la clave a GitHub..."

# 6. Agregar GitHub a known_hosts
echo
echo "🔧 Agregando GitHub a known_hosts..."
ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null
chmod 644 ~/.ssh/known_hosts

# 7. Probar conexión
echo
echo "🧪 Probando conexión con GitHub..."
SSH_RESULT=$(ssh -T git@github.com 2>&1)
echo "$SSH_RESULT"

if echo "$SSH_RESULT" | grep -q "successfully authenticated"; then
    echo
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║  ✅ ¡CONEXIÓN EXITOSA! Ya puedes hacer push                  ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo
    echo "🎯 Para hacer push ahora:"
    echo "   cd /home/ubuntu/escalafin_mvp"
    echo "   git push origin main"
    echo
else
    echo
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║  ⚠️  Conexión no exitosa                                     ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo
    echo "Posibles causas:"
    echo "1. La clave no fue agregada correctamente a GitHub"
    echo "2. La clave no está activa aún (espera 1-2 minutos)"
    echo "3. Problemas de red"
    echo
    echo "Para verificar:"
    echo "1. Ve a https://github.com/settings/keys"
    echo "2. Confirma que la clave esté agregada"
    echo "3. Intenta nuevamente: ssh -T git@github.com"
fi

echo
echo "📝 Información de la clave:"
echo "   Ubicación: $KEY_PATH"
echo "   Pública: ${KEY_PATH}.pub"
echo "   Config: ~/.ssh/config"
echo
echo "Para ver la clave pública nuevamente:"
echo "   cat ${KEY_PATH}.pub"
echo

exit 0
