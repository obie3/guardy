# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the app code: `screens/` for UI views, `components/` for reusable UI, `navigation/` for React Navigation setup, `services/` for data access, `context/` for providers, `types/` and `utils/` for shared definitions.
- `app/` hosts Expo Router layout files (e.g., `_layout.tsx`, `+not-found.tsx`).
- `assets/` stores fonts, images, and other static assets.
- Native scaffolding lives in `ios/` and `android/`.
- App entry points/config: `index.js`, `app.json`, `metro.config.js`, `babel.config.js`.

## Build, Test, and Development Commands
- `yarn dev` / `npm run dev`: start Expo with telemetry off for local development.
- `yarn start` / `npm start`: start Expo and reset the Metro cache.
- `yarn ios` / `npm run ios`: run on iOS simulator/device.
- `yarn android` / `npm run android`: run on Android emulator/device.
- `yarn build:web` / `npm run build:web`: export the web build.
- `yarn lint` / `npm run lint`: run Expo’s linting.
- `yarn test` / `npm test`: run Jest.

## Coding Style & Naming Conventions
- TypeScript/TSX is used in `src/`; follow existing patterns with 2-space indentation and semicolons.
- Component and screen files are PascalCase (e.g., `GuestInfoCard.tsx`).
- Prefer colocating component-specific helpers near the component, and keep service logic in `src/services/`.

## Testing Guidelines
- Jest is configured via `jest`/`jest-expo` dependencies.
- No dedicated test directory is present; when adding tests, use Jest defaults (`__tests__/` or `*.test.tsx`) near the code under test.
- Include tests for new screens, services, or critical logic where feasible.

## Commit & Pull Request Guidelines
- Commit history follows Conventional Commit-style prefixes (`feat:`, `fix:`, `chore:`). Keep summaries short and imperative.
- PRs should include: a concise description, testing notes (commands run), and screenshots for UI changes.
- Link related issues/tickets when available.

## Security & Configuration Tips
- Store secrets in environment files (e.g., `.env`) and keep them out of version control.
- If you modify native config or dependencies, verify both iOS and Android builds.
