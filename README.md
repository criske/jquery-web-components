# jquery-web-components

A simple way to integrate jquery with [native web-components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)

Download:
[1.2.0](https://raw.githubusercontent.com/criske/jquery-web-components/main/v/jwc-1.2.0.js) 

CDN (JSDELIVR)
[1.2.0](https://cdn.jsdelivr.net/gh/criske/jquery-web-components@main/v/jwc-1.2.0.js) 
[1.2.0-minified](https://cdn.jsdelivr.net/gh/criske/jquery-web-components@main/v/jwc-1.2.0.min.js)

```javascript
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
```

```javascript
$(document).ready(() => {
    $('button[is=fancy-button]').click(() => {
        $('fluent-component').changeMessage("Hello universe!");
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

The functions provided to `extend` object argument shouldn't be arrows. These are attached to webcomponent's `prototype`. See above how we access `changeMessage`.

Extending native html elements with fluent builder is simple:
```javascript
$wc(HTMLButtonElement).define('fluent-button',  'button');
```

## Builder methods:
- _template_ - could be a html string or a template id
- _templateSources_ - array of paths of template html or css files. (this has precedence over `template` method)
- _extend_ - object of methods that will attached to the web-component.
- _lifecycle web-components methods_:
    - _onCreate_ - called on web-component creation
    - _connectedCallback_ - called when wc is connected with a `$host` (the shadowRoot host) arg.  
    - _disconnecteCallback_ - called when wc is disconnected
    - _attributeChangedCallback_ - one must provide the callback, and an array of observed attributes. 
    When attr has changed callack is called with $host, and a `changed` object
    containing attr `name`, `oldValue`, and `newValue`
- _define_ - terminal method that will define the component; it takes the name and, as optional, the html element tag name. 

## Iteracting with web-component

- getting the `shadowRoot`
  ```javascript
  $('fluent-component').$shr()
  ```
- getting the shadowRoot `host`:
  ```javascript
    const $host = await $('fluent-component').$host();
    $host.find('p').css('outline', '1px solid red');
  ```
  Note that this returns a promise because the template might be loaded asynchronous with `templateSources`
- query a slot:
    ```javascript
    //...
    const slot = $host.slot('slot[name=my-slot]')
     ```
- placing an element into a slot:
    ```javascript
    //..
    const div = $host.slot($('<div>'), "my-slot");
    ```
- getting a method cretead with `extend`
     ```javascript
    //..
     $('fluent-component').changeMessage("Hello universe!");
    ```



