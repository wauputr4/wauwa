function findAndCheckClient(key, sessions) {
  // Cari client session yang sesuai dengan key
  const session = sessions.find((sess) => sess.id === key);

  // Pastikan client session ditemukan dan sudah siap digunakan
  if (!session || !session.client) {
    throw new Error(`Kunci: ${key} tidak ditemukan!`);
  }

  return session.client;
}

function findGroupByName(name, client) {
  // const groupName = async function(name,client) {
  const group = client.getChats().then((chats) => {
    return chats.find(
      (chat) => chat.isGroup && chat.name.toLowerCase() == name.toLowerCase()
    );
  });

  if (!group) {
    throw new Error(`No group found with name: ${name}`);
  }

  return group;
}

function socketAndLog(key, io, slug, status, other = null) {
  let message = {
    id: key,
    text: status + " hit endpoint " + slug,
  };
  if (other) {
    try {
      message.data = JSON.parse(other);
    } catch (e) {
      console.error("parsing JSON: ", e);
    }
  }
  io.emit("message", message);
  console.log(status + " api/" + slug + " | key : " + key);
}

module.exports = {
  findAndCheckClient: findAndCheckClient,
  findGroupByName: findGroupByName,
  socketAndLog: socketAndLog,
};
