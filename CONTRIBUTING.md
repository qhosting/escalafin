
# 🤝 Guía de Contribución - EscalaFin MVP

¡Gracias por tu interés en contribuir a EscalaFin MVP! Esta guía te ayudará a entender cómo puedes participar en el desarrollo del proyecto.

## 📋 Tabla de Contenidos

- [🚀 Empezando](#-empezando)
- [🏗️ Configuración de Desarrollo](#️-configuración-de-desarrollo)
- [📝 Convenciones de Código](#-convenciones-de-código)
- [🔄 Proceso de Contribución](#-proceso-de-contribución)
- [🧪 Testing](#-testing)
- [📚 Documentación](#-documentación)
- [🐛 Reportar Bugs](#-reportar-bugs)
- [✨ Sugerir Features](#-sugerir-features)

## 🚀 Empezando

### Prerrequisitos

- Node.js 18+
- Yarn package manager
- PostgreSQL 14+
- Git
- Editor de código (recomendado: VS Code)

### Setup Inicial

1. **Fork del repositorio**
   ```bash
   # Fork en GitHub y luego clonar
   git clone https://github.com/tu-username/escalafin-mvp.git
   cd escalafin-mvp
   ```

2. **Configurar remote upstream**
   ```bash
   git remote add upstream https://github.com/original-repo/escalafin-mvp.git
   ```

3. **Instalar dependencias**
   ```bash
   cd app
   yarn install
   ```

4. **Configurar base de datos**
   ```bash
   # Copiar archivo de ejemplo
   cp .env.example .env
   
   # Configurar DATABASE_URL y otras variables
   nano .env
   
   # Ejecutar migraciones
   yarn prisma db push
   yarn prisma db seed
   ```

5. **Verificar instalación**
   ```bash
   yarn dev
   # La app debe estar disponible en http://localhost:3000
   ```

## 🏗️ Configuración de Desarrollo

### Estructura del Proyecto

```
app/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── (auth)/            # Grupo de rutas de auth
│   ├── admin/             # Dashboard Admin
│   ├── asesor/            # Dashboard Asesor
│   ├── cliente/           # Portal Cliente
│   └── mobile/            # Módulo Móvil
├── components/            # Componentes React
│   ├── ui/               # Componentes base
│   ├── forms/            # Formularios
│   ├── dashboards/       # Dashboards
│   └── layouts/          # Layouts
├── lib/                  # Utilities y configuración
│   ├── api/              # Funciones API
│   ├── auth.ts           # NextAuth config
│   ├── db.ts             # Prisma client
│   └── utils.ts          # Utilidades
└── prisma/               # Database schema
```

### Herramientas de Desarrollo

#### VS Code Extensions (Recomendadas)
- ES7+ React/Redux/React-Native snippets
- Prisma
- Tailwind CSS IntelliSense
- TypeScript Importer
- Auto Rename Tag
- Prettier - Code formatter
- ESLint

#### Configuración de VS Code
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.suggest.autoImports": true
}
```

## 📝 Convenciones de Código

### TypeScript

```typescript
// ✅ Buenas prácticas
interface User {
  id: string;
  name: string;
  email: string;
}

// Usar tipos específicos, no 'any'
const fetchUser = async (id: string): Promise<User> => {
  // implementación
};

// Props de componentes siempre tipadas
interface ComponentProps {
  title: string;
  isVisible?: boolean;
}

export function Component({ title, isVisible = false }: ComponentProps) {
  // implementación
}
```

### Naming Conventions

```typescript
// Componentes: PascalCase
export function UserProfile() {}

// Archivos de componentes: kebab-case
// user-profile.tsx

// Variables y funciones: camelCase
const userName = 'John';
const getUserData = () => {};

// Constantes: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';

// Tipos e interfaces: PascalCase
interface UserData {}
type ApiResponse = {};
```

### Estructura de Componentes

```typescript
'use client'; // Solo si es necesario

import React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

// Tipos e interfaces primero
interface ComponentProps {
  title: string;
  onAction?: () => void;
}

// Componente principal
export function Component({ title, onAction }: ComponentProps) {
  // Hooks primero
  const [loading, setLoading] = useState(false);

  // useEffect después de useState
  useEffect(() => {
    // lógica
  }, []);

  // Funciones del componente
  const handleSubmit = async () => {
    try {
      setLoading(true);
      // lógica
      toast.success('Éxito');
    } catch (error) {
      toast.error('Error');
    } finally {
      setLoading(false);
    }
  };

  // Early returns
  if (!title) return null;

  // JSX
  return (
    <div className="space-y-4">
      <h1>{title}</h1>
      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Cargando...' : 'Enviar'}
      </Button>
    </div>
  );
}
```

### API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Lógica
    const data = await db.user.findMany();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

### CSS/Tailwind

```tsx
// ✅ Usar clases de Tailwind consistentemente
<div className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm">
  <h3 className="text-lg font-semibold text-gray-900">Título</h3>
  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
    Acción
  </Button>
</div>

// ✅ Agrupar clases lógicamente
<div className={`
  // Layout
  flex items-center justify-between
  // Spacing
  p-4 mb-6
  // Colors & Background
  bg-white text-gray-900
  // Border & Shadow
  border rounded-lg shadow-sm
  // States
  hover:shadow-md transition-shadow
`}>
```

## 🔄 Proceso de Contribución

### 1. Crear Branch

```bash
# Actualizar main
git checkout main
git pull upstream main

# Crear branch descriptivo
git checkout -b feature/nueva-funcionalidad
# o
git checkout -b fix/corregir-bug
# o
git checkout -b docs/actualizar-readme
```

### 2. Desarrollar

```bash
# Hacer commits atómicos y descriptivos
git add .
git commit -m "feat: agregar validación de email en formulario de registro"

# Tipos de commits seguir conventional commits
# feat: nueva funcionalidad
# fix: corrección de bug
# docs: cambios en documentación
# style: cambios de formato (no afectan lógica)
# refactor: refactoring de código
# test: agregar o modificar tests
# chore: tareas de mantenimiento
```

### 3. Testing

```bash
# Ejecutar todos los tests
yarn test

# Tests de tipos
yarn type-check

# Linting
yarn lint

# Build
yarn build
```

### 4. Pull Request

1. **Push al fork**
   ```bash
   git push origin feature/nueva-funcionalidad
   ```

2. **Crear PR en GitHub**
   - Título descriptivo
   - Descripción detallada del cambio
   - Referencia issues relacionados
   - Screenshots si aplica

3. **Plantilla de PR**
   ```markdown
   ## Descripción
   Breve descripción de los cambios realizados.

   ## Tipo de cambio
   - [ ] Bug fix (cambio que corrige un issue)
   - [ ] Nueva funcionalidad (cambio que agrega funcionalidad)
   - [ ] Breaking change (cambio que causa que funcionalidad existente no funcione)
   - [ ] Documentación

   ## Testing
   - [ ] Los tests pasan localmente
   - [ ] Se agregaron tests para cubrir los cambios
   - [ ] Se ejecutó linting sin errores

   ## Screenshots (si aplica)
   
   ## Issues relacionados
   Fixes #123
   ```

## 🧪 Testing

### Configuración de Tests

```typescript
// components/__tests__/component.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Component } from '../component';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const mockClick = jest.fn();
    render(<Component title="Test" onAction={mockClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockClick).toHaveBeenCalled();
  });
});
```

### API Tests

```typescript
// app/api/__tests__/users.test.ts
import { GET } from '../users/route';
import { NextRequest } from 'next/server';

// Mock de la base de datos
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findMany: jest.fn()
    }
  }
}));

describe('/api/users', () => {
  it('should return users', async () => {
    const request = new NextRequest('http://localhost:3000/api/users');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
  });
});
```

### Comandos de Testing

```bash
# Ejecutar todos los tests
yarn test

# Tests en modo watch
yarn test:watch

# Coverage report
yarn test:coverage

# Tests específicos
yarn test -- --testPathPattern="component.test.tsx"
```

## 📚 Documentación

### Comentarios en Código

```typescript
/**
 * Calcula el pago mensual de un préstamo
 * @param amount - Monto del préstamo
 * @param rate - Tasa de interés anual (como decimal)
 * @param termMonths - Término en meses
 * @returns Pago mensual calculado
 */
export function calculateMonthlyPayment(
  amount: number,
  rate: number,
  termMonths: number
): number {
  if (rate === 0) return amount / termMonths;
  
  const monthlyRate = rate / 12;
  return (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
         (Math.pow(1 + monthlyRate, termMonths) - 1);
}
```

### README de Componentes

```markdown
# UserProfile Component

## Descripción
Componente que muestra la información del perfil de usuario.

## Props
- `user` (User): Objeto de usuario
- `editable` (boolean): Si permite edición
- `onSave` (function): Callback al guardar cambios

## Ejemplo de uso
```tsx
<UserProfile 
  user={currentUser} 
  editable={true}
  onSave={handleUserSave}
/>
```

## Estados
- Loading: Muestra spinner
- Error: Muestra mensaje de error
- Success: Muestra datos del usuario
```

## 🐛 Reportar Bugs

### Información Necesaria

1. **Descripción clara del problema**
2. **Pasos para reproducir**
3. **Comportamiento esperado vs actual**
4. **Screenshots/videos si aplica**
5. **Entorno:**
   - OS: Windows/Mac/Linux
   - Browser: Chrome/Firefox/Safari
   - Versión de Node.js
   - Versión del proyecto

### Template de Issue

```markdown
**Describe the bug**
Una descripción clara y concisa del bug.

**To Reproduce**
Pasos para reproducir el comportamiento:
1. Ve a '...'
2. Click en '....'
3. Scroll down to '....'
4. Ver error

**Expected behavior**
Descripción de lo que esperabas que pasara.

**Screenshots**
Si aplica, agregar screenshots.

**Environment:**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 91]
- Node.js: [e.g. 18.17.0]
- Project version: [e.g. 2.1.0]

**Additional context**
Cualquier otro contexto sobre el problema.
```

## ✨ Sugerir Features

### Process

1. **Buscar features similares** en issues existentes
2. **Crear issue detallado** con:
   - Problema que resuelve
   - Solución propuesta
   - Alternativas consideradas
   - Impacto en usuarios

### Template de Feature Request

```markdown
**¿Tu feature request está relacionado con un problema?**
Una descripción clara y concisa del problema.

**Describe la solución que te gustaría**
Descripción clara de lo que quieres que pase.

**Describe alternativas que has considerado**
Descripción de soluciones alternativas.

**Contexto adicional**
Screenshots, mockups, o contexto adicional.

**Impacto esperado**
- Usuarios beneficiados
- Casos de uso
- Prioridad estimada
```

## 📊 Code Review

### Checklist para Reviewers

- [ ] ¿El código sigue las convenciones establecidas?
- [ ] ¿Está bien documentado?
- [ ] ¿Los tests pasan?
- [ ] ¿Es performante?
- [ ] ¿Es seguro?
- [ ] ¿Es accesible?

### Para Contributors

- Responde a comentarios constructivamente
- Haz cambios solicitados
- Mantén el PR actualizado con main
- Se paciente con el proceso de review

## 🎯 Roadmap y Prioridades

### Alta Prioridad
- Corrección de bugs críticos
- Mejoras de seguridad
- Performance

### Media Prioridad
- Nuevas funcionalidades
- Mejoras de UX
- Refactoring

### Baja Prioridad
- Optimizaciones menores
- Documentación
- Tests adicionales

## 🤝 Comunidad

### Comunicación
- GitHub Issues para bugs y features
- GitHub Discussions para preguntas
- Pull Requests para código

### Código de Conducta
- Se respetuoso y constructivo
- Ayuda a otros contributors
- Mantén discusiones enfocadas

---

¡Gracias por contribuir a EscalaFin MVP! 🚀

Tu participación hace que este proyecto sea mejor para todos.

