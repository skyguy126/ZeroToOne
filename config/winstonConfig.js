var winston = require('winston');

var options = {
    console: {
        level: 'silly',
        handleExceptions: true,
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }
};

var logger = new winston.createLogger({
    transports: [
        new winston.transports.Console(options.console)
    ],
    exitOnError: false, // do not exit on handled exceptions
});

logger.stream = {
    write: function(message, encoding) {
        logger.info(message.trim());
    }
};

module.exports = logger;
