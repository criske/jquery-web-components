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
        this.$host = this.$templateSources('./my-component.css', './my-component.html');
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


