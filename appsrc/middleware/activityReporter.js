const axios = require('axios');

const logger = require('../modules/config/logger');

module.exports = async (req) => {
    try {
        const userId = req.body?.loginUser?.userId || 'anonymous';
        const sessionId = req.body?.loginUser?.sessionId || 'anonymous';
        const activity = {
            app: req.get('Referer'),
            userId,
            sessionId,
            endpoint: req.originalUrl,
            method: req.method,
            page: req.get('X-Client-Page') || req.body.page || null,
            userIP: req.ip,
            userAgent: req.get('User-Agent'),
        };
        return await axios.post(process.env.ACTIVITY_SERVER_URL, activity);
    } catch (err) {
        logger.error(new Error(`'Activity logging failed:', ${err?.message}`));
        return
    }
};

