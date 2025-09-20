
# Contribuyendo a EscalaFin

## 🤝 Cómo Contribuir

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📋 Guías de Estilo

### Código
- Usar TypeScript estricto
- Seguir convenciones de ESLint/Prettier
- Documentar funciones complejas
- Usar nombres descriptivos

### Commits
Seguir [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `docs:` cambios en documentación
- `style:` cambios de formato
- `refactor:` refactorización de código
- `test:` agregar o modificar tests

### Pull Requests
- Título descriptivo
- Descripción detallada de cambios
- Screenshots si hay cambios de UI
- Tests actualizados

## 🔧 Configuración de Desarrollo

### Requisitos
- Node.js 18+
- PostgreSQL 14+
- Yarn

### Setup
```bash
git clone <fork-url>
cd escalafin_mvp/app
yarn install
cp .env.example .env
# Configurar variables de entorno
yarn prisma db push
yarn prisma db seed
yarn dev
```

## 🧪 Testing
```bash
yarn test          # Ejecutar tests
yarn test:coverage # Coverage report
yarn lint          # Linting
yarn tsc          # Type checking
```

## 📖 Documentación
- Mantener README.md actualizado
- Documentar APIs nuevas
- Agregar comentarios en código complejo
- Actualizar CHANGELOG.md

¡Gracias por contribuir a EscalaFin! 🚀
