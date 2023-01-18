const { createLogger, format, transports } = require('winston');
const { combine, timestamp, json } = format;


module.exports = function buildProdLogger() {
    return createLogger({
        level: 'debug',
        format: combine(
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            format.errors({ stack: true }),
            json(),
        ),
        defaultMeta: { service: 'hcs-server'},
        transports: [
            new transports.Console()
        ],
    });
}