# Auto-Test on Save Hook

**Trigger**: When Game.tsx is saved
**Action**: Run diagnostics and check for errors

This hook automatically checks for TypeScript errors whenever you save the Game.tsx file, catching issues early in development.

## Configuration
```json
{
  "name": "Test Game on Save",
  "trigger": "onSave",
  "filePattern": "**/Game.tsx",
  "action": "getDiagnostics"
}
```

## Usage
This hook runs automatically. No manual action needed.
