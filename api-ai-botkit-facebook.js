/* jshint node: true */
'use strict';

const
  apiai = require('apiai'),
  ware = require('ware'),
  uuidV1 = require('uuid/v1'),
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

  worker.middleware = {
    query: ware(),
    response: ware()
  };

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
          worker.sessionIds[channel] = uuidV1();
        }
        var options = {
          sessionId: worker.sessionIds[channel]
        };
        worker.middleware.query.run(requestText, options, function(err, query, options) {
          var request = worker.apiaiService.textRequest(
            query,
            options
          );

          request.on('response', function (response) {
            worker.middleware.response.run(message, response, bot,
              function(err, message, response, bot) {
                if (err) {
                  console.error(err);
                }
                worker.allCallback.forEach(function (callback) {
                  callback(message, response, bot);
                });

                if (isDefined(response.result)) {
                  var action = response.result.action;
                  // set action to null if action is not defined or used
                  action = isDefined(action) && worker.actionCallbacks[action] ?
                    action : null;

                  if (worker.actionCallbacks[action]) {
                    worker.actionCallbacks[action].forEach(function (callback) {
                      callback(message, response, bot);
                    });
                  }
                }
              }
            );
          });

          request.on('error', function (error) {
            console.error(error);
          });

          request.end();
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return worker;
}
