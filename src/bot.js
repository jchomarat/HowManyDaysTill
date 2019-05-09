// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes } = require("botbuilder");
const { Luis } = require("./luis");

class Bot {
  
  /**
   *
   * @param {LuisApplication} luisApplication The basic configuration needed to call LUIS. In this sample the configuration is retrieved from the .bot file.
   * @param {LuisPredictionOptions} luisPredictionOptions (Optional) Contains additional settings for configuring calls to LUIS.
   * @param {any} logger object for logging events, defaults to console if none is provided
   */
  constructor(luisApplication, luisPredictionOptions, logger) {
    
    if (!logger) {
      logger = console;
      logger.log('[DialogBot]: logger not passed in, defaulting to console');
    }

    this.logger = logger;
    this.luisApplication = luisApplication;
    this.luisPredictionOptions = luisPredictionOptions;
  }

   /**
   *
   * @param {TurnContext} on turn context object.
   */
  async onTurn(turnContext) {
    if (turnContext.activity.type === ActivityTypes.Message) {

      let luis;
      try {
          luis = new Luis(this.luisApplication, this.luisPredictionOptions, this.logger);
      } catch (err) {
          console.error(`[luisInitializationError]: ${ err }`);
          process.exit();
      } 

      var reply = await luis.process(turnContext);
      await turnContext.sendActivity(reply);

    }
  }
}

module.exports.Bot = Bot;
