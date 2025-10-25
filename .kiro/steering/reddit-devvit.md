---
inclusion: always
---

# Reddit Devvit Platform Constraints

## Security Restrictions
- **No unsafe-eval**: Cannot use libraries that rely on eval() or Function()
- **Content Security Policy**: Strict CSP prevents certain JavaScript patterns
- **No PixiJS**: Graphics library blocked due to CSP restrictions
- **Use Canvas 2D**: HTML5 Canvas 2D API is the recommended graphics solution

## Platform Limitations
- No WebSockets for real-time communication
- Use fetch() for server communication
- Limited external dependencies
- Must be web-compatible libraries only

## Best Practices
- Test all external libraries for CSP compatibility before integration
- Prefer native Web APIs over third-party libraries
- Keep bundle size small for faster loading
- Use localStorage for client-side persistence
- Implement graceful fallbacks for unsupported features

## File Structure
- `/src/client`: Full-screen webview code
- `/src/server`: Serverless backend (Node.js)
- `/src/shared`: Shared types and utilities
- `/src/devvit`: Devvit app integration

## API Communication
- Client calls server via `fetch(/my/api/endpoint)`
- Server has access to Redis for data persistence
- Use shared types for API contracts
