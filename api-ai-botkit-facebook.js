/* jshint node: true */
'use strict';

const
  apiai = require('apiai'),
  ware = require('ware'),
  aguid = require('aguid'),
  Entities = require('html-entities').XmlEntities,
  decoder = new Entities()
;

module.exports = function (config) {

  return createApiAiProcessing(config);
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

function createApiAiProcessing(config) {
  let worker = {};
  if (typeof config === 'string') {
    config = {
      token: config
    };
  }
  worker.apiaiService = apiai(config.token);
  worker.sessionIds = {};
  worker.useStickySessions = config.useStickySessions || false;

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
        let isEvent = message.event &&
          typeof message.event === 'object' &&
          message.event.name;
        let requestText = decoder.decode(message.text);
        requestText = requestText.replace("’", "'");

        let channel = message.channel;
        if (!(channel in worker.sessionIds)) {
          worker.sessionIds[channel] = worker.useStickySessions ?
            aguid(channel) :
            aguid();
        }
        // get options from message or set as empty
        let options = message.apiaiOptions || {};
        options.sessionId = worker.sessionIds[channel];

        worker.middleware.query.run(requestText, options, function(err, query, options) {
          let request = isEvent ?
            worker.apiaiService.eventRequest(
              message.event,
              options
            ) :
            worker.apiaiService.textRequest(
              query,
              options
            )
          ;

          request.on('response', (response) => {
            worker.middleware.response.run(message, response, bot,
              function(err, message, response, bot) {
                if (err) {
                  console.error(err);
                }
                worker.allCallback.forEach((callback) => {
                  callback(message, response, bot);
                });

                if (isDefined(response.result)) {
                  let action = response.result.action;
                  // set action to null if action is not defined or used
                  action = isDefined(action) && worker.actionCallbacks[action] ?
                    action : null;

                  if (worker.actionCallbacks[action]) {
                    worker.actionCallbacks[action].forEach((callback) => {
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
