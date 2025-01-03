**Komponentor.js** is a lightweight JavaScript framework designed to simplify the development of web applications by leveraging reusable HTML components and hash routing. Each component is a standalone HTML file that bundles all necessary code – including HTML, CSS, and JavaScript – into a single, portable unit.

## Key Features:

- Reusable Components: Build and manage modular components for consistent and scalable web apps.
- Easy Integration: Attach components to any DOM node with minimal setup.
- Dynamic Initialization: Pass parameters to components for customized behavior.
- Event and Method Exposure: Interact with components through exposed events and methods.
- Hash-based Routing: Built-in router for single-page application navigation.

## Installation

```bash
npm install komponentor.js
```

## Basic Usage

### Component Integration
```html
<div is="komponent" data-url="component.html"></div>
```

### Router Setup
```javascript
// Initialize the router
KomponentorRouter.init({
    container: '#app',  // Main container for route components
    defaultRoute: '/home'  // Optional default route
});

// Register routes
KomponentorRouter.route('/home', { url: 'components/home.html' });
KomponentorRouter.route('/users', { url: 'components/users.html' });
KomponentorRouter.route('/users|id=123', { 
    url: 'components/user-detail.html',
    data: { someOption: true }
});

// Programmatic navigation
KomponentorRouter.navigate('/users', { id: 123 });  // Results in: #/users|id=123
```

### URL Format
The router uses a simple hash-based URL format:
- Basic route: `#/path`
- With parameters: `#/path|param1=value1|param2=value2`

### Route Handlers
Routes can be registered with either:
- Komponent configuration object
- Custom function handler
```javascript
// Component handler
KomponentorRouter.route('/page', { url: 'page.html' });

// Function handler
KomponentorRouter.route('/custom', (params) => {
    // Custom routing logic
    console.log('Route params:', params);
});
```
