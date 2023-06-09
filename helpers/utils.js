//Check Client Session
function findAndCheckClient(key, sessions) {
  // Cari client session yang sesuai dengan key
  const session = sessions.find((sess) => sess.id === key);

  // Pastikan client session ditemukan dan sudah siap digunakan
  if (!session || !session.client) {
    throw new Error(`Kunci: ${key} tidak ditemukan!`);
  }

  return session.client;
}


async function findGroupByNameAsync(name, client) {
  try {
    const chats = await client.getChats();
    const group = chats.find(
      (chat) => chat.isGroup && chat.name.toLowerCase() == name.toLowerCase()
    );

    if (!group) {
      throw new Error(`No group found with name: ${name}`);
    }

    return group;
  } catch (error) {
    console.error('Error occurred while finding group:', error);
    return null; // Change to return null instead of false
  }
}




async function findGroupBySlugInvite(slug, client, key) {
  const group = await client.getInviteInfo(slug);

  //get serialize id from session
  const SessionController = require("../controllers/SessionController");
  const serialize_id = await SessionController.getSessionSerializeId(key);
  console.log('serialize_id :', serialize_id);

  let isParticipant = false;
  try {
    isParticipant = group.participants.some(participant => {
      console.log('participant.id._serialize_id :', participant.id._serialized);
      return participant.id._serialized === serialize_id;
    });
  } catch (error) {
    // Handle the error gracefully
    console.error('An error occurred while checking participants:', error);
    // You can choose to return a default value or continue execution
    // return defaultValue;
  }

  if (!isParticipant) {
    console.warn(`You are not joined with group ${group.subject}`);
    // You can choose to return a default value or continue execution
    // return defaultValue;
  }

  return group;
}




//Log Enpoint & IO
async function socketAndLog(io, key, slug, status, data = null) {
  //get session id from sessionController
  if (data) {
    console.log('execute data');
    if (data.method_type == 'send') {
      const LogSendController = require("../controllers/LogSendController");
      LogSendController.createLogSend({
        keyName: key,
        method: 'api/' + slug,
        status: status,

        to: data.to,
        message: data.message,
        response: JSON.stringify(data.response), // Convert response to string
        is_group: data.is_group,
      });
    }
  }

  let message = {
    id: key,
    text: status + " hit endpoint " + slug,
  };
  io.emit("message", message);
  console.log(new Date().toLocaleString() + " | " + status + " api/" + slug + " | key : " + key);
}

function getLogTime() {
  const logNow = new Date().toLocaleString() + " | ";
  return logNow;
}

module.exports = {
  findAndCheckClient: findAndCheckClient,
  findGroupByNameAsync: findGroupByNameAsync,
  socketAndLog: socketAndLog,
  findGroupBySlugInvite: findGroupBySlugInvite,
  getLogTime: getLogTime,
};
