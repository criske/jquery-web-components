/*
************************************API - PLAYGROUND***************************************
*/
class MyParagraph extends HTMLElement {

    constructor() {
        super();
        this.$host = this.$template('#my-paragraph');
    }

    async connectedCallback() {
        const $host = await this.$host;
        $host.slot().text($host.attr('msg'));
        $host.find('p').css('background-color', '#FE9868');
        $host.find('p > b').text('Updated with jQuery');
        const b = $host.find('p').find('b');
        b.css('background-color', 'green');
        $host.find('button[is=fancy-button]')
            .css('background-color', 'green')
            .text('Fancy Template button').click(() => {
                alert('Hello from template');
            });

    }

}

class FancyButton extends HTMLButtonElement {

    constructor() {
        super();
        $(this).css('background-color', 'yellow').text("Fancy Button");
    }
}


class MyComponent extends HTMLElement {

    constructor() {
        super();
        this.$host = $templateSources(this, './my-component.css', './my-component.html')
            .then(template => this.$template(template));
    }

    async connectedCallback() {
        const $host = await this.$host;
        //...
    }
}

class MyOtherComponent extends HTMLElement {

    constructor() {
        super();
        this.$host = $templateSources(this, './my-component.css', './my-other-component.html')
            .then(template => this.$template(template));
    }

    async connectedCallback() {
        const $host = await this.$host;
        //...
    }
}
customElements.define('my-component', MyComponent);
customElements.define('my-other-component', MyOtherComponent);
customElements.define('my-paragraph', MyParagraph);
customElements.define('fancy-button', FancyButton, { extends: 'button' });

$(document).ready(() => {
    const button = $('<button is="fancy-button">')
        .text('Fency Button')
        .click(() => alert("Hello from document"));
    $('body').append(button);
});


/*
************************************API***************************************
*/
HTMLElement.prototype.$template = function (template) {
    const $host = $(document).template(template, this);
    return document.readyState === "loaded"
        ? Promise.resolve($host)
        : new Promise(resolve => { $host.ready(() => resolve($host)); });
};

jQuery.fn.template = function (template, webComponent) {
    let $template = $(template);
    $template = $template.prop('tagName') !== 'TEMPLATE'
        ? $('<template>' + template + '</template>')
        : $template;
    const node = $template.get(0).content.cloneNode(true);
    const shadowRoot = webComponent.attachShadow({ mode: 'open' });
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

(function (jQuery) {
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
})(jQuery);

/**
 * Takes the sources and concatenates them into one and then cache the result
 * into element's constuctor. (serving as a static "class" property for future element instances).
 * 
 * @param {HTMLElement} element HTMLElement
 * @param  {...String} sources File sources.
 * @returns Promise or resolved promise if result is already cached.
 */
function $templateSources(element, ...sources) {
    if (!(element instanceof HTMLElement)) {
        throw new Error("element must a HTMLElement");
    }
    const ct = element.constructor;
    if (!ct.cachedTemplateXHR) {
        const fetchSrc = src => fetch(src)
            .then(response => {
                let result;
                if (response.ok) {
                    result = response.text();
                    if (response.headers.get('Content-Type').toLocaleLowerCase().includes('text/css')) {
                        //wrap with style tags;
                        result = Promise.allSettled(['<style>', result, '</style>']).then(data => {
                            return data.map(d => d.value).join('\n');
                        });
                    }
                } else {
                    result = Promise.reject(response);
                }
                return result;
            })
        ct.cachedTemplateXHR = Promise.allSettled(sources.map(fetchSrc)).then(results => {
            return results.map(r => r.value).join('\n');
        });
    }
    return ct.cachedTemplateXHR;
}


