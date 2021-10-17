# jquery-web-components

A simple way to integrate jquery with native components

Download:
[1.0.0](https://raw.githubusercontent.com/criske/jquery-web-components/main/v/jwc-1.0.0.js) 

CDN (JSDELIVR)
[1.0.0](https://cdn.jsdelivr.net/gh/criske/jquery-web-components@main/v/jwc-1.0.0.js) 
[1.0.0-minified](https://cdn.jsdelivr.net/gh/criske/jquery-web-components@main/v/jwc-1.0.0.min.js)

 - load a template, either by id or inline ` this.$template('<p>Inlined template</p>')` and store the promise into a member variable
   Note: a promise is needed because interally the template jQuery plugin ensuers that the document is ready.
 - on connectedCallback() resolve the promise

```javascript
class MyParagraph extends HTMLElement {

    constructor() {
        super();
        this.$host = this.$template('#my-paragraph');
    }

    async connectedCallback() {
        const $host = await this.$host;
        $host.slot().text($host.attr('msg'));
        $host.find('p').css('background-color', 'red');
        $host.find('p > b').text('Updated with jQuery');
        const b = $host.find('p').find('b');
        b.css('background-color', 'green');
    }
}
customElements.define('my-paragraph', MyParagraph);

```
Unless is not targeting a slot, `jQuery.find()` should be used.

The html might look like:
```html
<body>
    <template id="my-paragraph">
        <style>
            p {
                color: white;
                background-color: wheat;
                padding: 5px;
            }
        </style>
        <p>
            <slot name="my-text">My default text</slot>
        </p>
        <br/>
        <b></b>
    </template>

    <my-paragraph msg="this is message is from my-paragraph">
        <span slot="my-text"></span>
    </my-paragraph>
</body>
```

## Interacting with slots:

Getting a slot:
```javascript
const slot = $host.slot('slot[name=my-slot]');
```

Adding an element to a slot:
```javascript
const div = $host.slot($('<div>'), "my-slot");
```

## Loading templates from separate files.

It's possible to write your css/html templates in a separate file. For this
`$templateSources` can be used. These templates are loaded remotely only once per `HTMLElement` subclass,
meaning that subsequent instances will share the same template.

```javascript
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
```

## Extending native HTML elements ##

Using jQuery with extending native HTML elements is straightforward:

```javascript
class FancyButton extends HTMLButtonElement {

    constructor() {
        super();
        $(this).css('background-color', 'yellow').text("Fancy Button");
    }
    
}
customElements.define('fancy-button', FancyButton, { extends: 'button' });
```
Creating manually:
```javascript
const button = $('<button is="fancy-button">')
    .text('Fency Button')
    .click(() => alert("Hello from document"));
$('body').append(button);
```

Accesing them from a custom element template:
```javascript
//...
async connectedCallback() {
    const $host = await this.$host;
    $host.find('button[is=fancy-button]')
        .css('background-color', 'green')
        .text('Fancy Template button')
        .click(() => {
            alert('Hello from template');
        });
}
```

## Define web-compoents using fluent builder

Since v1.1.0 web components can be defined using a fluent builder:

```javascript
$wc()
    .template('<p>')
    .onCreate(function () { this.hello = "Hello World"; })
    .connectedCallback(function ($host) { $host.find('p').text(this.hello); })
    .watchAttr("color")
    .attributeChangedCallback(($host, name, old, neu) => {
        if(name === 'color'){
            $host.find('p').css('color', neu);
        }
    })
    .extend({
        changeMessage: async function (newMessage) {
            const $host = await this.$host;
            $host.find('p').text(`"${this.hello}" changed with "${newMessage}"`);
        }
    })
    .define('fluent-component');
```

```javascript
$(document).ready(() => {
    $('button[is=fancy-button]').click(() => {
        $('fluent-component').get(0).changeMessage("Hello universe!");
    });
    $('#btn-color').click(() => {
        const randomColor = Math.floor(Math.random()*16777215).toString(16);
        $('fluent-component').attr('color', '#'+randomColor);
    });
});
```

For callbacks, arrow or anon functions can be used. Use anon functions if you want to access
the webcomponent's scope, besides `$host` provided as arg.

In the above example see how `this.hello` is available in any callback. (this would not be possible if 
callback was arrow). But of course if only `$host` is needed, one can use just arrow instead.

The functions provided to `extend` object argument should never be arrows. These are attached to webcomponent's `prototype`. See above how we access `changeMessage`.

Extending native html elements with fluent builder is simple:
```javascript
$wc(HTMLButtonElement).define('fluent-button', {extends : 'button'});
```

