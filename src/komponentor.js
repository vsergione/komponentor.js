/**
 * Komponentor - A jQuery-based component loading system
 * @module komponentor
 */

(function ($) {
    const ERRORS = {
        NO_URL: 'No URL provided',
        AJAX_FAIL: 'Failed to initiate component due to failed ajax request',
        LOAD_FAIL: 'Failed to load Komponent'
    }; 
    
    // Add logging function near the top of the module
    const log = (...args) => {
        if (komponentor.options.debug) {
            console.log('[Komponentor]', ...args);
        }
    };
    
    const DEFAULT_OVERLAY_HTML = `
        <div style='position: absolute; top:50%; transform: translate(-50%, -50%); left:50%'>
            Se incarca
        </div>
    `;
    const createOverlay = () => {
        return $("<div>")
            .html(DEFAULT_OVERLAY_HTML)
            .addClass("komponent-overlay")
            .css({
                border: 'dashed 1px silver',
                background: '#eee',
                position: 'absolute',
                zIndex: 1000000,
                textAlign: 'center'
            });
    };

    window.komponentor = {
        components: {},
        path: null,
        options: {
            debug: true
        }
    };

    /**
     *
     * @param opts
     * @returns {Promise<unknown>}
     */
    $.fn.komponent = function (opts) {

        if(typeof opts==="undefined") {
            opts = {};
        }
        if(typeof opts==="string") {
            opts = {url:opts};
        }


        let options = this.data();
        if(typeof options==="undefined") {
            options = {};
        }
        Object.assign(options,opts);
        options.$el = this;
        if(!options.url)
            console.log("options.url",options);


        options.data = typeof opts.data==="undefined" ? {} : opts.data;
        let tmp = options.url.split("|");
        options.url = tmp.shift();

        tmp.forEach((para)=>{
            let tmp = para.split("=");
            options.data[tmp[0]] = typeof tmp[1] ==="undefined" ? null :  tmp[1];
        });

        try {
            return Komponent(options);
            
        } catch (error) {
            log("Failed to load Komponent: ",error);
            options.$el.html("<div>Failed to load Komponent <b>"+ options.url + "</b></div>");
            return;
        }

    };

    /**
     * @param options
     * @returns {Promise<unknown>}
     * @constructor
     */
    async function Komponent(options) {
        const kmp = {
            ready: false,
            $el: null,
            loading: ()=>{},
            find: function (subject){
                return this.$el.find(subject);
            },
            addListener: function (event,listener) {
                this.listeners[event].push(listener);
            },
            listeners:{ready:[]}
        };

        delete options["komponent"];

        Object.assign(kmp,options);

        if(kmp.$el && kmp.$el.data("komponent")) {
            return options.$el.data("komponent");
        }

        const overlay = createOverlay().clone().width($(kmp.$el).width()).height($(kmp.$el).height()).insertBefore(kmp.$el);
        const overlayParent = overlay.parent()
        if(overlayParent.length && overlayParent[0].tagName==="BODY") {
            overlay.css("width","100%").css("height","100%")
        }

        try {
            const source = await fetchKomponent(kmp);

            try {
                if(!options.bind || !$(options.bind).data("komponent")) {
                    log("renderKomponent no bind",kmp);
                    kmp.init_result = renderKomponent(kmp,source);
                    overlay.remove();
                    return kmp;
                }

                const bindKomponent = $(options.bind).data("komponent");
                if(bindKomponent.ready) {
                    log("renderKomponent bind ready",kmp);
                    kmp.data = bindKomponent;
                    kmp.init_result = renderKomponent(kmp,source);
                    overlay.remove();
                    return kmp;
                }
                log("Add listener to",bindKomponent);
                
                kmp.loading();
                bindKomponent.addListener("ready",(k)=>{
                    log("renderKomponent on bind ready",kmp);
                    options.data = k;
                    Object.assign(kmp,options);
                    kmp.init_result = renderKomponent(kmp,source);
                    overlay.remove();
                    log("Component loaded",kmp);
                });
            
    
                return kmp;
            } catch (error) {
                kmp.init_result = renderKomponent(kmp,source);
                overlay.remove();
                console.error("Error in Komponent",error);
            }
        } catch (error) {
            overlay.remove();
            kmp.$el.html("Could not load component "+kmp.url);
            log("Error in Komponent",error);
            // throw(error);
            return kmp;
        }
        
    


    }

    String.prototype.hashCode = function()
    {
        let hash = 0, i, chr;
        if (this.length === 0) return hash;
        for (i = 0; i < this.length; i++) {
            chr   = this.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
    };

    /**
     *
     * @param k
     * @param html
     */
    async function renderKomponent(k,html) {
        let dummy = $("<div>").appendTo("body").append(html);
        dummy.find("script").each((_,item)=>{
            $(item).remove();
        });

        const $renderedKomponent = dummy.children().remove();
        dummy.remove();

        let initFunc;

        if(typeof init_komponent==="function") {
            initFunc = init_komponent.bind(k);
            init_komponent=null;
            delete init_komponent;
        } else {
            initFunc = async function() {};
        }

        if(k.$el && $renderedKomponent.length) {
            if(k.replace) {
                // let id = k.$el.attr("id");
                k.$el.replaceWith($renderedKomponent);
                k.$el = $renderedKomponent;
                // k.$el.attr("id",id);

            }
            else {
                k.$el.empty().append($renderedKomponent);
            }
        }

        if(!k.$el) {
            k.$el = $renderedKomponent;
        }

        setTimeout(()=>k.$el.prev(".komponent-overlay").remove(),100);


     

        k.$el.data("komponent",k)
            .attr("is","komponent")
            .find("*").data("komponent",k);



        try {   
            await initFunc(k,(k.data?k.data:null));
            k.listeners.ready.forEach(listener => listener(k));
            k.ready = true;
        } catch (e) {
            console.error("Error in initKomponent",e);
        }

        if(typeof k.autoload=="undefined" || k.autoload) {

            k.find("[is=komponent]").each((_,el)=>$(el).komponent());
            k.find("komponent").each((_,el)=>$(el).komponent());
        }
    }

    /**
     *
     * @returns {Promise<unknown>}
     * @param opts
     */
    async function fetchKomponent(options) {
        if (!options.url) {
            throw new Error(ERRORS.NO_URL);
        }
        try {
            const response = await fetch(options.url);
            if (!response.ok) {
                throw {
                    reason: ERRORS.AJAX_FAIL,
                    status: response.status,
                    statusText: response.statusText,
                    request: options
                };
            }
            return await response.text();
        } catch (error) {
            throw {
                reason: ERRORS.AJAX_FAIL,
                error,
                request: options
            };
        }
    };

    /**
     *
     * @param container
     * @returns {Promise<unknown[]>}
     */
    async function loadKomponents(container) {
        $(container).find("[is=komponent]").each(async function () {
            await $(this).komponent();
        });

    }


    /**
     *
     * @param url
     * @param url
     * @returns {{data: data, options: (function(*): obj), send: (function(): Promise<unknown>), url: (function(*): obj)}}
     */
    window.komponentor.intent = function (url) {

        let init_data = {data:{}};
        let _data = {};

        let obj = {
            url: function(url) {
                init_data.url = url;
                return this;
            },
            data: function (attr,val) {
                if(typeof attr==="object") {
                    Object.assign(init_data.data,attr);
                    return this;
                }
                init_data.data[attr] = val;
                return this;
            },
            send: function (data) {
                if(data) {
                    obj.data(data);
                }
                // add overlay
                try {
                    return Komponent(init_data);
                } catch (error) {
                    console.error("Error in Komponent",error);
                }
            }
        };

        if(url) {
            obj.url(url);
        }

        return  obj;
    };

    komponentor.sendIntent = function(options) {

        fetchKomponent(options)
            .then(  function (c) {
                if(!c)
                    return;
                if(c.hasOwnProperty("exec"))
                    c.exec(options.data);
            })
            .catch(function (v) {
                console.log("could not load",v,options);
            })
            .finally(()=>{
                $overlay.remove();
            });
    };

    komponentor.loadKomponents = function(container) {

        return loadKomponents(container);
    }

    function cleanupKomponent(k) {
        if (k.$el) {
            k.$el.find('*').removeData('komponent');
        }
    }

})(jQuery);
