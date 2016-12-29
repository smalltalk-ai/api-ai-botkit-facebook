/* jshint node: true */
'use strict';

const
  apiai = require('apiai'),
  uuid = require('node-uuid'),
  Entities = require('html-entities').XmlEntities,
  decoder = new Entities()
;

module.exports = function (apiaiToken) {
  return createApiAiProcessing(apiaiToken);
};

function isDefined(obj) {
  if (typeof obj == 'undefined') {
    return false;
  }

  if (!obj) {
    return false;
  }

  return obj !== null;
}

function createApiAiProcessing(token) {
  var worker = {};

  worker.apiaiService = apiai(token, "subscription_key");
  worker.sessionIds = {};

  worker.actionCallbacks = {};
  worker.allCallback = [];

  worker.action = function (action, callback) {
    if (worker.actionCallbacks[action]) {
      worker.actionCallbacks[action].push(callback);
    } else {
      worker.actionCallbacks[action] = [callback];
    }

    return worker;
  };

  worker.all = function (callback) {
    worker.allCallback.push(callback);
    return worker;
  };

  worker.process = function (message, bot) {
    try {
      if (message.type == 'user_message') {
        var requestText = decoder.decode(message.text);
        requestText = requestText.replace("’", "'");

        var channel = message.channel;

        if (!(channel in worker.sessionIds)) {
          worker.sessionIds[channel] = uuid.v1();
        }
        var request = worker.apiaiService.textRequest(
          requestText,
          { sessionId: worker.sessionIds[channel] }
        );

        request.on('response', function (response) {

          worker.allCallback.forEach(function (callback) {
            callback(message, response, bot);
          });

          if (isDefined(response.result)) {
            var action = response.result.action;

            if (isDefined(action)) {
              if (worker.actionCallbacks[action]) {
                worker.actionCallbacks[action].forEach(function (callback) {
                  callback(message, response, bot);
                });
              }
            }
          }
        });

        request.on('error', function (error) {
          console.error(error);
        });

        request.end();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return worker;
}
