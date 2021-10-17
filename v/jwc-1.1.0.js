HTMLElement.prototype.$template = function (template) {
    const $host = $(document).template(template, this);
    return document.readyState === "loaded"
        ? Promise.resolve($host)
        : new Promise(resolve => { $host.ready(() => resolve($host)); });
};

HTMLElement.prototype.$templateSources = function (...sources) {
    return $templateSources(this, ...sources).then(template => this.$template(template));
}

jQuery.fn.template = function (template, webComponent) {
    if(webComponent.shadowRoot){
        return $(webComponent.shadowRoot.host);
    }
    let $template = $(template);
    $template = $template.prop('tagName') !== 'TEMPLATE'
        ? $('<template>' + template + '</template>')
        : $template;
    const node = $template.get(0).content.cloneNode(true);
    const shadowRoot = webComponent.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(node);
    return $(shadowRoot.host);
};

jQuery.fn.slot = function (queryOrElem, slotName) {
    const shadowRoot = this.get(0).shadowRoot;
    if (shadowRoot) {
        throw new Error('Current element doesn\'t have a shadowroot!');
    }
    if (queryOrElem instanceof jQuery) {
        if (slotName) {
            queryOrElem = queryOrElem.attr("slot", slotName);
        }
        return this.append(queryOrElem.clone());
    } else {
        const slots = shadowRoot.querySelectorAll(queryOrElem || 'slot');
        const allNodes = [];
        slots.forEach(slot => {
            slot.assignedNodes().forEach(node => {
                allNodes.push(node);
            });
        });
        return $(allNodes);
    }
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
 * @param  {...String | jQuery} sources File sources or JQuery element.
 * @returns Promise or resolved promise if result is already cached.
 */
function $templateSources(element, ...sources) {
    if (!(element instanceof HTMLElement)) {
        throw new Error("element must a HTMLElement");
    }
    const ct = element.constructor;
    if (!ct.cachedTemplateXHR) {
        const fetchSrc = src => {
            let resultPromise;
            if (src instanceof jQuery) {
                resultPromise = Promise.resolve($('<div>').append(src.clone()).html());
            } else {
                resultPromise = fetch(src)
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
                    });
            }
            return resultPromise;
        };
        ct.cachedTemplateXHR = Promise.allSettled(sources.map(fetchSrc)).then(results => {
            return results.map(r => r.value).join('\n');
        });
    }
    return ct.cachedTemplateXHR;
}

function $wc(htmElement = HTMLElement) {

    if (htmElement instanceof HTMLElement) {
        throw new Error("argmuent must be a HTMLElement");
    }

    const builder = {
        template: undefined,
        templateSources: undefined,
        onCreate: function () { },
        connectedCallback: function ($host) { },
        disconnectedCallback: function ($host) { },
        watchAttr: [],
        attributeChangedCallback: function ($host, attrName, oldVal, newVal) { },
        adoptedCallback: function ($host) { },
        extend: {},
    };

    return {
        onCreate: function (onCreate) {
            builder.onCreate = onCreate;
            return this;
        },
        connectedCallback: function (connectedCallback) {
            builder.connectedCallback = connectedCallback;
            return this;
        },
        disconnectedCallback: function (disconnectedCallback) {
            builder.disconnectedCallback = disconnectedCallback;
            return this;
        },
        watchAttr: function (...watchAttr) {
            builder.watchAttr = watchAttr;
            return this;
        },
        attributeChangedCallback: function (attributeChangedCallback) {
            builder.attributeChangedCallback = attributeChangedCallback;
            return this;
        },
        adoptedCallback: function (adoptedCallback) {
            builder.adoptedCallback = adoptedCallback;
            return this;
        },
        template: function (template) {
            builder.template = template;
            return this;
        },
        templateSources: function (templateSources) {
            builder.templateSources = templateSources;
            return this;
        },
        extend: function (extend) {
            builder.extend = extend;
            return this;
        },
        define: function (name, options) {
            if (customElements.get(name)) {
                throw new Error(`$name is already defined as web component`);
            }

            const WC = (class extends htmElement {

                static get observedAttributes() {
                    return builder.watchAttr;
                }

                constructor() {
                    super();
                    if (builder.templateSources) {
                        this.$host = this.$templateSources(...templateSources);
                    } else if (builder.template) {
                        this.$host = this.$template(builder.template);
                    } else {
                        this.$host = Promise.resolve(this);
                    }
                    builder.onCreate.bind(this)();
                }

                connectedCallback() {
                    this.$host.then(builder.connectedCallback.bind(this));
                }

                disconnectedCallback() {
                    this.$host.then(builder.disconnectedCallback.bind(this));
                }

                attributeChangedCallback(name, oldValue, newValue) {
                    this.$host.then($host => {
                        builder.attributeChangedCallback.call(this, $host, name, oldValue, newValue);
                    });
                }

                adoptedCallback() {
                    this.$host.then(builder.adoptedCallback.bind(this));
                }
            });

            for (const [k, v] of Object.entries(builder.extend)) {
                WC.prototype[k] = function () {
                    return v.apply(this, arguments);
                };
            }

            customElements.define(name, WC, options);
            return customElements.whenDefined(name);
        }
    };
}