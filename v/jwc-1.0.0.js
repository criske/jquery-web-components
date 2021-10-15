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