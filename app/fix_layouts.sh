#!/bin/bash

# Lista de archivos a corregir
files=(
"./app/cliente/payments/page.tsx"
"./app/cliente/loans/page.tsx"
"./app/cliente/loans/[id]/page.tsx"
"./app/cliente/credit-applications/page.tsx"
"./app/admin/analytics/page.tsx"
"./app/admin/clients/new/page.tsx"
"./app/admin/clients/migrate/page.tsx"
"./app/admin/clients/[id]/page.tsx"
"./app/admin/clients/[id]/edit/page.tsx"
"./app/admin/scoring/page.tsx"
"./app/admin/loans/new/page.tsx"
"./app/admin/loans/[id]/page.tsx"
"./app/admin/loans/[id]/edit/page.tsx"
"./app/admin/audit/page.tsx"
"./app/admin/credit-applications/page.tsx"
"./app/asesor/clients/page.tsx"
"./app/asesor/loans/new/page.tsx"
"./app/asesor/loans/[id]/page.tsx"
"./app/asesor/loans/[id]/edit/page.tsx"
"./app/asesor/credit-applications/page.tsx"
)

echo "Corrigiendo páginas con contenedores problemáticos..."

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "Corrigiendo: $file"
        
        # Corregir min-h-screen bg-background
        sed -i 's/<div className="min-h-screen bg-background">/<div>/g' "$file"
        
        # Corregir min-h-screen bg-gray-50
        sed -i 's/<div className="min-h-screen bg-gray-50">/<div>/g' "$file"
        
        # Corregir container mx-auto px-4 py-8
        sed -i 's/<div className="container mx-auto px-4 py-8">/<div>/g' "$file"
        
        # Corregir max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8
        sed -i 's/<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">/<div>/g' "$file"
        
        # Corregir container mx-auto py-6
        sed -i 's/<div className="container mx-auto py-6">/<div>/g' "$file"
        
        # Corregir container mx-auto px-4 py-6
        sed -i 's/<div className="container mx-auto px-4 py-6">/<div>/g' "$file"
        
        # Remover div vacíos innecesarios que puedan quedar
        sed -i 's/<div><div>/<div>/g' "$file"
        sed -i 's/<\/div><\/div>/<\/div>/g' "$file"
        
    else
        echo "Archivo no encontrado: $file"
    fi
done

echo "¡Corrección completada!"
