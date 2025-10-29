#!/bin/bash

echo "=== DETECTOR Y CORRECTOR DE SYMLINKS ==="
echo ""

# Buscar todos los symlinks en el proyecto
echo "Buscando symlinks problematicos..."
SYMLINKS=$(find . -type l -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null)

if [ -z "$SYMLINKS" ]; then
    echo "No se encontraron symlinks problematicos"
    exit 0
fi

echo "Symlinks encontrados:"
echo "$SYMLINKS"
echo ""

# Procesar cada symlink
while IFS= read -r symlink; do
    if [ -L "$symlink" ]; then
        target=$(readlink "$symlink")
        echo "---"
        echo "Symlink: $symlink"
        echo "Target: $target"
        
        # Verificar si el target existe
        if [ -e "$target" ]; then
            echo "Target existe, copiando contenido real..."
            
            # Eliminar el symlink
            rm "$symlink"
            
            # Copiar el archivo real
            if [ -d "$target" ]; then
                cp -r "$target" "$symlink"
                echo "Directorio copiado"
            else
                cp "$target" "$symlink"
                echo "Archivo copiado"
            fi
        else
            echo "Target no existe: $target"
            echo "Eliminando symlink..."
            rm "$symlink"
        fi
    fi
done <<< "$SYMLINKS"

echo ""
echo "=== CORRECCION COMPLETADA ==="
