class MyParagraph extends HTMLElement {

    constructor() {
        super();
        this.$host = this.$template('#my-paragraph');
    }

    async connectedCallback() {
        const $host = await this.$host;
        $host.slot().text($host.attr('msg'));
        $host.find('p').css('background-color', 'red');
    }

}
customElements.define('my-paragraph', MyParagraph);


HTMLElement.prototype.$template = function (template, shadowInit = { mode: 'open' }) {
    const $host = $(document).template(template, this, shadowInit);
    return new Promise(resolve => {
        $host.ready(() => resolve($host))
    });
};

const $ = jQuery = new Proxy(jQuery, {
    apply: function (target, thisArg, args) {
        return target(...args);
    },
    get: function (target, prop, receiver) {
        return Reflect.get(...arguments);
    }
});


jQuery.fn.template = function (template, webComponent, shadowInit = { mode: 'open' }) {
    let $template = $(template);
    $template = $template.prop('tagName') !== 'TEMPLATE'
        ? $('<template>' + template + '</template>')
        : $template;
    const node = $template.get(0).content.cloneNode(true);
    const shadowRoot = webComponent.attachShadow(shadowInit);
    shadowRoot.appendChild(node);
    return $(shadowRoot.host);
};

jQuery.fn.slot = function (query) {
    const shadowRoot = this.get(0).shadowRoot;
    if (shadowRoot) {
        const slots = shadowRoot.querySelectorAll(query || 'slot');
        const allNodes = [];
        slots.forEach(slot => {
            slot.assignedNodes().forEach(node => {
                allNodes.push(node);
            });
        });
        return $(allNodes);
    }
    throw new Error('Current element doesn\'t have a shadowroot!');
};

const $find = jQuery.fn.find;
jQuery.fn.extend({
    find: function () {
        let result = $find.apply(this, arguments);
        if (result.length === 0) {
            const shadowRoot = this.get(0).shadowRoot;
            if (shadowRoot) {
                const shadowResult = shadowRoot.querySelectorAll(...arguments);
                result = $(shadowResult);
            }
        }
        return result;
    }
});

