// Licensed under the MIT License.

const { LuisRecognizer } = require('botbuilder-ai');
const Recognizers = require('@microsoft/recognizers-text-date-time');
const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { creator, resolver } = require('@microsoft/recognizers-text-data-types-timex-expression');

class Luis {

   /**
   *
   * @param {LuisApplication} luisApplication The basic configuration needed to call LUIS. In this sample the configuration is retrieved from the .bot file.
   * @param {LuisPredictionOptions} luisPredictionOptions (Optional) Contains additional settings for configuring calls to LUIS.
   * @param {any} logger object for logging events, defaults to console if none is provided
   */
    constructor(luisApplication, luisPredictionOptions, logger) {
        this.luisRecognizer = new LuisRecognizer(luisApplication, luisPredictionOptions, true);
        
        if (!logger) {
          logger = console;
          logger.log('[DialogBot]: logger not passed in, defaulting to console');
        }
    
        this.logger = logger;
    }

    /**
   *
   * @param {TurnContext} on turn context object.
   */
  async process(turnContext) {
        // Perform a call to LUIS to retrieve results for the user's message.
        const results = await this.luisRecognizer.recognize(turnContext);

        // Since the LuisRecognizer was configured to include the raw results, get the `topScoringIntent` as specified by LUIS.
        const topIntent = results.luisResult.topScoringIntent;
        let topEntity;
        if (results.luisResult.entities.length > 0) {
        topEntity = results.luisResult.entities[0];
        }

        if (topIntent.intent !== 'None' && topEntity != null) {
        return this.processEntity(topEntity);
        } else {
            // If the top scoring intent was "None" tell the user no valid intents were found and provide help.
            return "Sorry, I did not understand your question!";
        }
    }

    /**
     *
     * @param {Entity} on luisResults: best match entity for the intent
     */
    processEntity(entity){
        const countDays = (from, to) => {
            const timeDiff = to - from;
            const days = timeDiff / (1000 * 60 * 60 * 24);
            return Math.ceil(days*1);
        };
        
        if (entity.type == "event"){
            const now = new Date();
            let daysCount;
            // Switch for the event, and calculate today - this event to get the number of days
            switch(entity.entity.toLowerCase()){
                case "xmas":
                case "christmas":
                    const targetDate = new Date(now.getFullYear(), 12, 25);
                    daysCount = countDays(now, targetDate);
                    break;
            }

            return `It's in ${ daysCount } days.`;
        }
        else if (entity.type == "builtin.datetimeV2.daterange") {
            const now = new Date();

            const result = Recognizers.recognizeDateTime(entity.entity.toLowerCase(), Recognizers.Culture.English);
            let reply = "I am sorry, I could not figure out the date you are asking :(";
            
            // Parse all potentials results, but we'll get only the first one
            result.forEach(result => {

                const distinctTimexExpressions = new Set(
                    result.resolution.values
                        .filter(({ timex }) => timex !== undefined)
                        .map(({ timex }) => timex)
                );
        
                const parseTimex = (o) => {
                    if (o.types.has('date')) {
                        if (o.types.has('definite')) {
                            const targetDate = new Date(o.year, o.month - 1, o.dayOfMonth);
                            const daysCount = countDays(now, targetDate);
                            reply = `It's in ${ daysCount } days.`;
                        } else {
                            // Date is ambigous. If a day, then get current month & current year - if no day, throw standard reply
                            if (o.dayOfMonth !== undefined) {
                                const year = (o.year === undefined ? now.getFullYear() : o.year);
                                const month = (o.month === undefined ? now.getMonth() + 1 : o.month);

                                const targetDate = new Date(year, month - 1, o.dayOfMonth);
                                const daysCount = countDays(now, targetDate);
                                reply = `Assuming you meant ${ targetDate.toDateString() }, it's in ${ daysCount } days.`;
                            }
                        }
                    }
                };
                
                parseTimex(new TimexProperty(
                    Array.from(distinctTimexExpressions)[0]
                ));
            });

            return reply;
        }
    }
}

module.exports.Luis = Luis;