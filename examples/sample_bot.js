'use strict';

const
  Botkit = require('botkit'),
  apiaibotkit = require('../api-ai-botkit-facebook'),
  accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
  verifyToken = process.env.FACEBOOK_VERIFY_TOKEN,
  appSecret = process.env.FACEBOOK_APP_SECRET,
  apiaiToken = process.env.APIAI_TOKEN,
  apiai = apiaibotkit(apiaiToken),
  controller = Botkit.slackbot({
    access_token: accessToken,
    verify_token: verifyToken,
    app_secret: appSecret
  })
;

controller.hears('.*', 'message_received', function (bot, message) {
  apiai.process(message, bot);
});

apiai.all(function (message, resp, bot) {
  console.log(resp.result.action);
});

apiai
  .action('smalltalk.greetings', function (message, resp, bot) {
    var responseText = resp.result.fulfillment.speech;
    bot.reply(message, responseText);
  })
  .action('input.unknown', function (message, resp, bot) {
    bot.reply(message, 'Sorry, I don\'t understand');
  })
;
