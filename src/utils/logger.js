const { createLogger, format, transports } = require("winston");

const logger = createLogger({
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.printf(({ level, message }) => `${level}: ${message}`))
        }),

    ],
    format: format.combine(
        format.timestamp(),
        format.json(),
        format.metadata(),
        format.prettyPrint()
    )
})



module.exports = { logger }