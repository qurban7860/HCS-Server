const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf, colorize, errors } = format;


module.exports = function buildDevLogger() {
    const loggingFormat = printf(({ level, message, timestamp, stack }) => {
        return `${timestamp} ${level}: ${stack || message}`;
    });

    return createLogger({
        level: 'debug',
        format: combine(
            colorize(),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            loggingFormat,
            errors({ stack: true })
        ),
        defaultMeta: { service: 'user-service' },
        transports: [
            new transports.Console()
            //to write the logger into file.
            // new transports.File({ filename: 'error.log', level: 'error' }),
            // new transports.File({ filename: 'combined.log' }),
        ],
    });
}