# Komponentor

A lightweight JavaScript framework for building modular web applications with HTML-based components, a component tree, hash routing, and optional headless intents.

## Features

- **Components** - Load HTML by URL into a host element; optional `init_komponent(komponent, data)` script; no build step.
- **Component tree** - Parent/child hierarchy with cascade destroy.
- **Scan** - Auto-mount components from `data-komponent="url|key=val"` markers in the DOM.
- **Hash router** - Map hash paths to components; mount in an outlet with route params.
- **Intents** - Headless "components" (no DOM node): load HTML, run init, optionally attach UI via the manager; can be part of the tree (destroy with parent).
- **jQuery optional** - Core works without jQuery; jQuery is used only as a helper when present.

## Repository contents

| Module        | File(s)        | Description |
|---------------|----------------|-------------|
| **Komponentor** | `src/komponentor.js` | Single-file runtime: mount, scan, route, intent, context lifecycle. |
| **KViews**    | `src/kviews.js`     | KModel + KView: template rendering (Handlebars or built-in `{{key}}` fallback). Requires jQuery. |


Built (minified) files go to `dist/` (e.g. `komponentor.min.js`, `kviews.min.js`).

## Quick start

1. **Include the script** (and optionally jQuery):

```html
<div id="app"></div>
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="path/to/komponentor.js"></script>
<script>
  komponentor.config.debug = true;
  komponentor.config.baseUrl = "/";
  komponentor.root("#app", "components/welcome.html");
</script>
```

2. **Define a component** (e.g. `components/welcome.html`):

```html
<div class="welcome">
  <h1>Hello</h1>
</div>
<script>
  function init_komponent(komponent, data) {
    // komponent.find("h1"), komponent.ctx.on(...), etc.
  }
</script>
```

3. **Use the router** (optional):

```javascript
komponentor.route({
  outlet: "#app",
  routes: {
    "#/": "components/home.html",
    "#/about": "components/about.html",
  },
  notFound: "components/404.html",
});
komponentor.navigate("#/about");
```

## API (single-file Komponentor)

| Method | Description |
|--------|-------------|
| `komponentor.root(host, urlOrOpts)` | Set app root; replace previous root. |
| `komponentor.mount(host, urlOrOpts)` | Mount a component on `host`. |
| `komponentor.scan(container?, { parent?, replaceExisting? })` | Mount all `[data-komponent]` in `container`. |
| `komponentor.route({ outlet, routes, notFound })` | Configure and start hash router. |
| `komponentor.navigate(hash)` | Set `location.hash`. |
| `komponentor.intent(urlOrOpts).data(...).send({ parent? })` | Run a headless intent (no DOM); optional `parent` for tree lifecycle. |
| `komponentor.runIntent(url, data, { parent? })` | Convenience wrapper for intent. |

Component marker in HTML: `data-komponent="/path/to/file.html|key=value"`.

## Build

```bash
npm install
npm run build
```

This minifies `src/**/*.js` into `dist/` (with source maps). Use `npm run watch` to rebuild on change.

## Documentation

- **[docs/komponentor.md](docs/komponentor.md)** - Komponentor: API, config, mount/scan, Context, Komponent, Intent, router.
- **[docs/kviews.md](docs/kviews.md)** - KViews: KModel, KView, getKModel, templates, lifecycle.
- **[docs/HOW-TO-GUIDE.md](docs/HOW-TO-GUIDE.md)** - Single-file Komponentor: setup, mount, scan, router, intents, nested components, events.

Example pages are in **docs/examples/**.

## License

MIT (see [LICENSE](LICENSE)).
