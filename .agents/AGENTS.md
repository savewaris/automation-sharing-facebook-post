# Workspace Agent Rules

## Modular Frontend & Reusable Components

1. **Frontend File Structure**:
   - Never write monolithic single-file frontend logic (>150 lines).
   - Divide frontend scripts into single-responsibility ES Modules under `frontend/js/`:
     - `api.js`: REST API wrappers.
     - `groups.js` / domain logic: State management & DOM rendering.
     - `terminal.js` / loggers: UI logging widgets.
     - `websocket.js`: Real-time WebSocket connection handling.
   - Load the entry point in HTML via `<script type="module" src="app.js"></script>`.

2. **Reusable Automation Modules**:
   - Keep backend automation modules (`BrowserManager` for Playwright persistent profiles, `HistoryManager` for local JSON storage/de-duplication, `WebSocketLogger` for live log streaming) decoupled from specific business logic so they can be reused across projects.
