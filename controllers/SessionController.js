const SessionModel = require('../models/Session');
const crypto = require('crypto');
const wwebjs = require('whatsapp-web.js');
const packageJson = require('../package.json');

async function createOrUpdateSession(sessionData) {
    try {
        const { keyName, description, ready, number, platform, pushname, serialize_id } = sessionData;
        // Generate hash of key_name
        const hash = crypto.createHash('sha256').update(keyName).digest('hex');

        // Find session with matching key_name
        const [session, created] = await SessionModel.Session.findOrCreate({
            where: { key_name: keyName },
            defaults: {
                key_hash: hash,
                description: description,
                ready: ready,
                number: number,
                platform: platform,
                pushname: pushname,
                serialize_id: serialize_id,
                app_version: packageJson.version,
                wwebjs_version: wwebjs.version,
            }
        });

        if (!created) {
            // Update existing session
            if (description) {
                session.description = description;
            }
            // if (keyName) {
            //     session.keyName = keyName;
            // }
            session.ready = ready;
            await session.save();
        }

        console.log(`Session with key_name "${keyName}" was ${created ? 'created' : 'updated'}.`);
    } catch (error) {
        console.error('Error creating/updating session:', error);
    }
}


async function getSessionId(key_name) {
    try {
        // Find session with matching key_name
        const session = await SessionModel.Session.findOne({
            where: { key_name: key_name }
        });

        if (session) {
            return session.id;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting session id:', error);
    }
}

//create function get session serialize id
async function getSessionSerializeId(key_name) {
    try {
        // Find session with matching key_name
        const session = await SessionModel.Session.findOne({
            where: { key_name: key_name }
        });

        if (session) {
            return session.serialize_id;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting session id:', error);
    }
}


module.exports = { createOrUpdateSession, getSessionId, getSessionSerializeId };
