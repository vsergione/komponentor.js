/**
 * Komponentor Router - Hash-based routing system
 * @module komponentor-router
 */

(function($) {

    const Router = {
        routes: {},
        currentRoute: null,
        defaultRoute: null,
        container: null,
        options: {
            accessControl: (route)=>true,
            debug: false,
            autoInit: true
        }
    };

    // Logging utility
    const log = (...args) => {
        if (Router.options.debug) {
            console.log('[KomponentorRouter]', ...args);
        }
    };

    /**
     * Initialize the router
     * @param {Object} options Router configuration
     * @param {string} options.container Container selector where components will be rendered
     * @param {boolean} options.debug Enable debug logging
     * @param {string} options.defaultRoute Default route when none specified
     */
    Router.init = function(options = {}) {
        Object.assign(this.options, options);
        
        if (options.container) {
            this.container = $(options.container);
        }
        
        if (options.defaultRoute) {
            this.defaultRoute = options.defaultRoute;
        }

        // Handle initial route
        window.addEventListener('load', () => this.handleRoute());

        // Handle route changes
        window.addEventListener('hashchange', (e) => {
           log('Route handler called from:', new Error().stack.split('\n')[2].trim());

            e.preventDefault();
            this.handleRoute();
        });

        log('Router initialized', this.options);
        return this;
    };

    /**
     * Add a route handler
     * @param {string} path Route path
     * @param {Object|Function} handler Route handler or component config
     */
    Router.route = function(path, handler) {
        if (typeof handler === 'string') {
            // If handler is a string, treat it as a component URL
            handler = { url: handler };
        }

        this.routes[path] = handler;
        log('Route added', path, handler);
        return this;
    };

    /**
     * Parse the current hash location
     * @returns {Object} Parsed route data
     */
    Router.parseRoute = function() {
        const hash = window.location.hash.substring(1) || this.defaultRoute || '';
        const [path, ...paramPairs] = hash.split('|');
        const params = {};
        
        paramPairs.forEach(pair => {
            const [key, value] = pair.split('=');
            params[key] = value;
        });

        return {
            path,
            params,
            hash: hash
        };
    };

    /**
     * Handle route change
     */
    Router.handleRoute = async function() {
        const route = this.parseRoute();
        
        // Exit if hash hasn't changed from current route
        if (this.currentRoute && this.currentRoute.hash === route.hash) {
            log('Hash unchanged, skipping route handling');
            return;
        }

        let handler = null;
        const routes = Object.keys(this.routes).sort().reverse();
        for(let i=0;i<routes.length;i++) {
            if(route.path.match(new RegExp("^"+routes[i]+"$"))) {
                handler = this.routes[routes[i]];
                break;
            }
        }

        // Check access control if configured
        if (this.options.accessControl) {
            const isAllowed = await this.options.accessControl(route);
            if (!isAllowed) {
                log('Access denied for route', route.path);
                return;
            }
        }
        log('Handling route', route, handler);

        if (!handler) {
            log('No handler found for route', route.path);
            if (this.defaultRoute && route.path !== this.defaultRoute) {
                this.navigate(this.defaultRoute);
            }
            return;
        }

        try {
            if (typeof handler === 'function') {
                // Execute function handler
                handler = await handler(route);
                
            } 
            log("handler",handler);
            if (typeof handler === 'object') {
                // Load component
                if (!this.container) {
                    throw new Error('No container specified for component rendering');
                }

                // Clear previous component
                this.container.empty();

                // Create component element
                const componentEl = $('<komponent>')
                    .appendTo(this.container);

                // Load component with route params
                await componentEl.komponent({
                    ...handler,
                    data: {
                        ...handler.data,
                        ...route.params
                    }
                });
            }

            this.currentRoute = route;
            log('Route handled successfully', route);
        } catch (error) {
            console.error('Error handling route:', error);
        }
    };

    /**
     * Navigate to a route
     * @param {string} path Route path
     * @param {Object} params Route parameters
     */
    Router.navigate = function(path, params = {}) {
        const paramString = Object.entries(params)
            .map(([key, value]) => `${key}=${value}`)
            .join('|');

        const hash = paramString ? `${path}|${paramString}` : path;
        window.location.hash = hash;
    };

    /**
     * Get current route information
     * @returns {Object} Current route data
     */
    Router.getCurrentRoute = function() {
        return this.currentRoute;
    };

    // Export router to global scope
    window.krouter = Router;

    // Auto-initialize if enabled
    $(document).ready(() => {
        // Wait for komponentor to be available
        if (typeof window.komponentor === 'undefined') {
            console.error('Komponentor not found. Make sure komponentor.modern.js is loaded first.');
            return;
        }

        if (Router.options.autoInit) {
            Router.init();
        }
    });

})(jQuery); 