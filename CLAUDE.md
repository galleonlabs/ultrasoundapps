# UltrasoundApps Development Guidelines

## Commands
- Development: `cd homepage && npm run dev`
- Build: `cd homepage && npm run build`
- Lint: `cd homepage && npm run lint`
- Preview: `cd homepage && npm run preview`
- Deploy: `cd homepage && npm run deploy`
- Firebase Functions:
  - Build: `cd homepage/functions && npm run build`
  - Serve: `cd homepage/functions && npm run serve`

## Code Style
- **TypeScript**: Strict typing with explicit interfaces
- **Formatting**: 2-space indentation, semicolons, trailing commas
- **Components**: Functional React components with typed props
- **Naming**: PascalCase for components/interfaces, camelCase for variables/functions
- **Imports**: React first, then libraries, then local imports
- **State**: React hooks for local state, Firebase for backend
- **Styling**: TailwindCSS with component CSS modules when needed
- **Error Handling**: Try/catch for async, proper Firebase error handling
- **Organization**: Component-based architecture in dedicated directories