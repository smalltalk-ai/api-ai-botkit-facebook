# api-ai-botkit-facebook

[![npm](https://img.shields.io/npm/v/api-ai-botkit-facebook.svg)](https://www.npmjs.com/package/api-ai-botkit-facebook)

Utility lib for creating Facebook Messenger bots with Botkit and api.ai. Based off of the api-ai-botkit.

For usage sample code see `examples/sample_bot.js`

## Steps for using lib

Install library from npm
```sh
npm install --save api-ai-botkit-facebook
```

Import Library
```js
const apiaibotkit = require('api-ai-botkit-facebook');
```

Create `apiai` object using token from http://api.ai website
```js
const apiai = apiaibotkit(apiaiToken);
```

Use `apiai` object in `controller.hears`
```js
controller.hears('.*', 'message_received', function (bot, message) {
    apiai.process(message, bot);
});
```

Implement different reactions to appropriate actions
```js
apiai
  .action('greetings', function (message, resp, bot) {
    var responseText = resp.result.fulfillment.speech;
    bot.reply(message, responseText);
  })
  .action('input.unknown', function (message, resp, bot) {
    bot.reply(message, "Sorry, I don't understand");
  })
  .action(null, function(message, resp, bot) {
    // handle all actions no not specified with
    // other actions (e.g., greetings and input.unknown)
    var responseText = resp.result.fulfillment.speech;
    bot.reply(message, responseText);
  })
;
```
## Middleware

The functionality can be extended using middleware functions. These functions can plugin to the api.ai running processes at couple useful places and make changes to both the query or response.

### Middleware Endpoints

The module currently supports middleware insertion in two places:

* When sending a query, before the query is sent to api.ai
* When receiving a response, before triggering any events

Query and Response middleware functions are added to the module using an Express-style "use" syntax. Each function receives a set of parameters and a next function which must be called to continue processing the middleware stack.

### Query Middleware

Query middleware can be used to do things like preprocess the query or options before it gets sent out to api.ai.
```js
apiai.middleware.query.use((worker, query, options, next) => {
  // do something...
  // options.contexts.resetContexts = true;
  next();
});
```

### Response Middleware

Response middleware can be used to do things like preprocess the response content. Additional information can be added to the response object for use down the chain.

```js
apiai.middleware.response.use((worker, message, response, bot, next) => {
  // do something...
  // response.extrainfo = 'bar';
  next();
});
```
