# AGENTS.md Sections

Sylva generates a standardized `AGENTS.md` with 17 sections. Each section provides specific context that AI coding tools use to generate more accurate, project-aware code.

## Section Reference

### 1. Project Overview
High-level description of what the project does, its sub-services, and primary purpose.

### 2. Agent Persona
Optional persona description for AI assistants working on this project (e.g., "You are a backend engineer specializing in FastAPI").

### 3. Tech Stack
Every language, framework, library, database, and external API used. Includes versions when identifiable from dependency manifests.

### 4. Architecture
Directory layout with module responsibilities. Includes an ASCII architecture diagram showing relationships between sub-services and external integrations.

Example output:
```
myshabeauty/
├── frontend/
│   ├── components/
│   │   ├── HomePage.jsx
│   │   ├── ProductDetailPage.jsx
│   │   └── CartDrawer.jsx
│   └── contexts/
│       ├── AuthContext.js
│       └── CartContext.js
├── backend/
│   ├── server.py
│   └── wix_service.py
└── tests/
    └── test_*.py
```

### 5. Code Style
Naming conventions, formatting rules, import ordering, type-hinting practices, and linter configurations. Separated by stack when applicable (e.g., frontend vs backend).

### 6. Anti-Patterns & Restrictions
Explicit rules about what NOT to do. Examples:
- "NEVER hardcode discount/badge UI"
- "NEVER commit API tokens"
- "NEVER hardcode CORS origins"

### 7. Database & State Management
Database technology, ORM/ODM patterns, and state management strategies (e.g., React Context, Redux, Vuex).

### 8. Error Handling & Logging
Error handling patterns, logging libraries, and structured logging conventions.

### 9. Testing Commands
Exact commands to run tests:
```bash
pytest
npm test
npm run test:e2e
```

### 10. Testing Guidelines
Test frameworks, naming conventions, file placement rules, and mocking strategies.

### 11. Security & Compliance
Authentication patterns, secret management, CORS configuration, and compliance requirements.

### 12. Dependencies & Environment
How to install dependencies, manage environments, and configure build tools.

### 13. PR & Git Rules
Branching strategy, commit message conventions, and CI requirements.

### 14. Documentation Standards
How documentation should be written and maintained.

### 15. Common Patterns
Frequently used code patterns in the project (e.g., "Always use Context for shared state", "Debounce network calls").

### 16. Agent Workflow / SOP
Step-by-step standard operating procedure for AI agents:
1. Classify the change (frontend, backend, tests)
2. Check existing patterns
3. Implement following conventions
4. Add tests
5. Validate deployment impact

### 17. Few-Shot Examples
Concrete "good" and "bad" code examples showing project-specific patterns:

```javascript
// Good: Using Context for Auth
import { createContext, useContext } from 'react';
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Bad: Hardcoding values
const DiscountLabel = "10% OFF"; // Should derive from backend
```
