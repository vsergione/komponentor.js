**Komponentor.js** is a lightweight JavaScript framework designed to simplify and speed up the development of web applications by leveraging reusable HTML components and hash routing. Each component is a standalone HTML file that bundles all necessary code – including HTML, CSS, and JavaScript – into a single, portable unit.

## Key Features:

- Reusable Components: Build and manage modular components for consistent and scalable web apps.
- Easy Integration: Attach components to any DOM node with minimal setup.
- Dynamic Initialization: Pass parameters to components for customized behavior.
- Event and Method Exposure: Interact with components through exposed events and methods.
- Hash-based Routing: Built-in router for single-page application navigation.
- Access Control: Easily manage access control for your routes.
 
 
## Basic Usage

### Creating and using components

Include the following files in your project:
```HTML
<script src="jquery.min.js"></script>
<script src="komponentor.min.js"></script>
<script src="krouter.js"></script>
```

#### Component definition
```HTML
<!-- component.html -->
<div>
    <h1>Hello <span id="name">name</span></h1>
</div>
<script>
    function init_komponent() {
        this.find("#name").text(this.data.name);
    }
</script>
```

#### Component usage
```HTML
<div is="komponent" data-url="component.html" id="my-komponent"></div>
<script>
    $("#my-komponent").komponent({
        data: {
            name: "John Doe"
        }
    });
</script>
```

### Router Integration

#### Router setup
```javascript
// Initialize the router
krouter.init({
    container: '#app',  // Main container for route components
    defaultRoute: '/home'  // Optional default route
});

// Register static routes
krouter.route('/home', { url: 'components/home.html' });
krouter.route('/users', { url: 'components/users.html' });
krouter.route('/users|id=123', { 
    url: 'components/user-detail.html',
    data: { someOption: true }
});

// Register custom route handler
krouter.route('/path/to/.*', async (route) => {
    return {
        url:route.path.replace('/path/to/','/some/other/path/')+".html",
        data:route.params
    }
});

// Register catch all route handler
krouter.route('.*', async (route) => {
    // do something with the route
    let url = route.path+".html";
    return {url:url,data:route.params}
});

// Programmatic navigation
krouter.navigate('/users', { id: 123 });  // Results in: #/users|id=123
```

### URL Format
The router uses a simple hash-based URL format:
- Basic route: `#/path`
- With parameters: `#/path|param1=value1|param2=value2`

### Route Handlers
Routes can be registered with either:
- Komponent configuration object (url, parameters)
- Custom function handler which returns a Komponent configuration object

```javascript
// Component handler
KomponentorRouter.route('/page', { url: 'page.html' });

// Function handler
KomponentorRouter.route('/custom', (params) => {
    // Custom routing logic
    return {url:'custom.html',data:params}
});
```

## Reference
The reference documentation is still in progress. To get an idea of what's possible see the examples folder.