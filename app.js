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
        $(this).css('background-color', 'yellow');
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
        this.$host = this.$templateSources('./my-component.css', $('<div>This is my other component template kept in a separate file</div>'));
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

$wc()
    .template('<p>')
    .onCreate(function () { this.hello = "Hello World"; })
    .connectedCallback(function ($host) { $host.find('p').text(this.hello); })
    .attributeChangedCallback(($host, changed) => {
        if(changed.name === 'color'){
            $host.find('p').css('color', changed.newValue);
        }
    }, ['color'])
    .extend({
        changeMessage: async function (newMessage) {
            const $host = await this.$host;
            $host.find('p').text(`"${this.hello}" changed with "${newMessage}"`);
        }
    })
    .define('fluent-component');

$wc(HTMLButtonElement).define('fluent-button', 'button');

$(document).ready(async () => {
    $('button[is=fancy-button]').click(() => {
        $('fluent-component').changeMessage("Hello universe!");
    });
    $('button[is=fluent-button]').click(() => {
        const randomColor = Math.floor(Math.random()*16777215).toString(16);
        $('fluent-component').attr('color', '#'+randomColor);
    });

    const $host = await $('fluent-component').$host();

    $host.find('p').css('outline', '1px solid red');
    console.log($('fluent-component').$shr().getSelection());
});


