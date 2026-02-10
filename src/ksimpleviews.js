/**
 * KSimpleViews - KModel + KView with template rendering.
 * Requires: jQuery.
 * Optional: Handlebars (window.Handlebars) for full syntax; otherwise uses built-in {{key}} / {{key.sub}} fallback.
 * No Komponentor dependency.
 */
(function (root, $) {
    "use strict";

    if (!$ || typeof $.fn !== "object") {
        throw new Error("KSimpleViews requires jQuery");
    }

    const Handlebars = root.Handlebars;

    /** Fallback when Handlebars is missing: {{key}} and {{key.sub}} only. */
    function defaultCompile(html) {
        return function (data) {
            if (data == null) data = {};
            return String(html).replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => {
                const parts = path.split(".");
                let v = data;
                for (const p of parts) {
                    v = v != null && typeof v === "object" ? v[p] : undefined;
                }
                return v != null ? String(v) : "";
            });
        };
    }

    function compileTemplate(html) {
        if (Handlebars && typeof Handlebars.compile === "function") {
            return Handlebars.compile(html);
        }
        return defaultCompile(html);
    }
    class KView {
        #compiled;
        #model;
        #el;
        #destroyed = false;

        /**
         * @param {jQuery|HTMLElement|string} el - Single element: mount point; its outerHTML is the template. Replaced by the rendered root on first render.
         * @param {KModel} model - KModel instance.
         * @param {Object} [lifecycle] - Optional object with onDestroy(fn); if provided, view.destroy() is called when lifecycle is torn down.
         * @throws {Error} If el is not a single node.
         */
        constructor(el, lifecycle) {
            const $el = $(el);
            if ($el.length !== 1) {
                throw new Error("KView: el must be a single node (got " + $el.length + ")");
            }
            this.#el = $el;
            this.#compiled = compileTemplate($el[0].outerHTML);

            if (lifecycle && typeof lifecycle.onDestroy === "function") {
                lifecycle.onDestroy(() => this.destroy());
            }
        }

        render() {
            const existingData = this.#el.data("komponent") || null;

            if (this.#destroyed) return;
            try {
                const html = this.#compiled(this.#model.props);
                const $content = $(html);

                this.#el.replaceWith($content);
                this.#el = $content;
                this.#el.data("model", this.#model).attr("is","kview");
//                this.#el.find("*").data("model", this.#model);
            } catch (e) {
                const $error = $("<div>Error in KView.render</div>");
                this.#el.replaceWith($error);
                this.#el = $error;
                console.error("Error in KView.render", e);
            }

            if (existingData != null) {
                this.#el.data("komponent", existingData);
            }
        }

        /**
         * Current root element(s) in the DOM. Before first render, returns the mount element; after, the rendered root.
         * @returns {jQuery}
         */
        getRoot() {
            return this.#el || $();
        }

        setModel(model) {
            if (this.#destroyed) return;
            this.#model = model;
            this.render();
        }

        /**
         * Unbind this view from the model and mark as destroyed. Removes the view root from the DOM.
         */
        destroy() {
            if (this.#destroyed) return;
            this.#destroyed = true;
            if (this.#model && typeof this.#model.unbindView === "function") {
                this.#model.unbindView(this);
            }
            if (this.#el && this.#el.length) this.#el.remove();
            this.#model = null;
            this.#el = null;
        }
    }

    /**
     * KModel - Observable data for use with KView.
     * data / props, update(name, value), bindView(view), unbindView(view), render(), destroy().
     * Events: "change" (after update or data set), "view:bind", "view:unbind", "destroy".
     */
    class KModel {
        views = [];
        #data = {};
        #destroyed = false;
        #listeners = new Map(); // event -> [{ fn, ctx }]

        get props() {
            return this.#data;
        }

        get data() {
            return this.#data;
        }

        set data(val) {
            if (this.#destroyed) return;
            this.#data = val;
            this._trigger("change", { data: this.#data });
            this.render();
        }

        constructor(data) {
            this.#data = data || {};
        }

        /**
         * Subscribe to an event. Events: "change", "view:bind", "view:unbind", "destroy".
         * @param {string} event - Event name.
         * @param {function} fn - Callback(payload).
         * @param {*} [ctx] - Optional this for fn.
         * @returns {KModel} this
         */
        on(event, fn, ctx) {
            if (typeof fn !== "function") return this;
            const arr = this.#listeners.get(event) || [];
            arr.push({ fn, ctx: ctx || null });
            this.#listeners.set(event, arr);
            return this;
        }

        /**
         * Unsubscribe from an event.
         * @param {string} event - Event name.
         * @param {function} fn - Same function reference as passed to on().
         * @param {*} [ctx] - Optional context (must match on() to remove).
         * @returns {KModel} this
         */
        off(event, fn, ctx) {
            const arr = this.#listeners.get(event);
            if (!arr) return this;
            this.#listeners.set(
                event,
                arr.filter((l) => !(l.fn === fn && (ctx == null || l.ctx === ctx)))
            );
            return this;
        }

        /**
         * Emit an event to all listeners.
         * @param {string} event - Event name.
         * @param {*} payload - Data passed to listeners.
         * @returns {KModel} this
         */
        trigger(event, payload) {
            const arr = this.#listeners.get(event);
            if (!arr || !arr.length) return this;
            for (const l of arr.slice()) {
                try {
                    l.fn.call(l.ctx || null, payload);
                } catch (e) {
                    console.error("KModel event handler error", event, e);
                }
            }
            return this;
        }

        _trigger(event, payload) {
            this.trigger(event, payload);
        }

        update(name, val) {
            if (this.#destroyed) return;
            this.#data[name] = val;
            this._trigger("change", { name, value: val });
            this.render();
        }

        bindView(view) {
            if (this.#destroyed) return;
            if (this.views.indexOf(view) === -1) {
                this.views.push(view);
                this._trigger("view:bind", { view });
            }
            view.setModel(this);
        }

        unbindView(view) {
            const i = this.views.indexOf(view);
            if (i !== -1) {
                this.views.splice(i, 1);
                this._trigger("view:unbind", { view });
            }
        }

        unbindAllViews() {
            this.views.length = 0;
        }

        render() {
            if (this.#destroyed) return;
            this.views.forEach((v) => v.render());
        }

        destroy() {
            if (this.#destroyed) return;
            this.#destroyed = true;
            this._trigger("destroy", { model: this });
            this.views.forEach((v) => {
                if (v && typeof v.destroy === "function") v.destroy();
            });
            this.views.length = 0;
            this.#listeners.clear();
            this.#data = {};
        }
    }

    root.KModel = KModel;
    root.KView = KView;
    root.getKModel = function(el) {
        return $(el).parents("[is=kview]").data("model");
    }
})(typeof window !== "undefined" ? window : globalThis, typeof window !== "undefined" && window.jQuery);
