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
    </template>

    <my-paragraph msg="this is message is from my-paragraph">
        <span slot="my-text"></span>
    </my-paragraph>
</body>
```
