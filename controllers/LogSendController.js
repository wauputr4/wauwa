const SessionModel = require('../models/Session');
const LogSendModel = require('../models/LogSend');

async function createLogSend(data) {
    try {
        // const { sessionId, description, ready, number, platform, pushname, serialize_id } = data;
        const { keyName, to, message, method, response, isGroup, status } = data;
        const wwebjs = require('whatsapp-web.js');
        const packageJson = require('../package.json');

        try {
            if (!keyName) {
                return console.error('key_name is undefined');
            }

            // Find session with matching key_name
            const session = await SessionModel.Session.findOne({
                where: { key_name: keyName }
            });

            if (session) {
                var sessionId = session.id;
            } else {
                var sessionId = null;
                // return console.error('Session id is invalid');
            }
        } catch (error) {
            return console.error('Error getting session id:', error);
        }

        // Create a new LogSend instance with the given properties
        const logSend = await LogSendModel.LogSend.create({
            session_id: sessionId,
            session_label: keyName,
            to: to,
            message: message,
            method: method,
            response: response,
            is_group: isGroup,
            status: status,
            app_version: packageJson.version,
            wwebjs_version: wwebjs.version
        });
        console.log(`LogSend created with id ${logSend.id}.`);
        return logSend;
    } catch (error) {
        console.error('Error creating LogSend:', error);
        throw error;
    }
}

async function getLogSendsBySession(sessionId) {
    try {
        // Find all LogSends that belong to the specified session
        const logSends = await LogSendModel.LogSend.findAll({
            where: {
                session_id: sessionId
            }
        });
        console.log(`${logSends.length} LogSends found for session with id ${sessionId}.`);
        return logSends;
    } catch (error) {
        console.error('Error retrieving LogSends:', error);
        throw error;
    }
}

// module.exports = LogSendController;
module.exports = { createLogSend, getLogSendsBySession };