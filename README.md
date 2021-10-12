# jquery-web-components

A simple way to integrate jquery with native components

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
Unless is not targeting a slot, `jQuery.find()` could be used too instead of `slot()`. (jQuery doesn't support slot css queries).

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

