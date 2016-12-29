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
