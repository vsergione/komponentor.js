class DataView {
    #container;
    #template;
    #model;
    #el;
    /**
     * @param {HTMLElement} container
     * @param {DataModel} model
     * @param {string} template
     */
    constructor(container,model,template) {
       
        this.#container = container;
        this.#model = model;
        this.#template = typeof template==="undefined"?$(container).html():template; 
        this.#container.empty();
        console.log(this.#model);
    }
    render() {
        try {   
            const _ = this.#model.props;
            let html;
            eval("html = `" + this.#template.replaceAll(/\n/g,"") + "`");
            this.#el = $(html).appendTo(this.#container.empty());
            this.#el.data("model",this.#model);
            this.#el.find("*").data("model",this.#model);
        } catch (e) {
            this.#el = $("Error in DataView.render").appendTo(this.#container.empty());
            console.error("Error in DataView.render",e);
        }
    }
}
class DataModel {
    views = [];
    #attributes = {};
    get props() {
        return this.data;
    }
    constructor(data) {
        this.data = data;
    }
    update(name,val) {
        this.data[name] = val;
        this.render();
    }
    bindView(view) {
        this.views.push(view);
        view.render();
    }
    render() {
        this.views.forEach(view=>view.render());
    }
}