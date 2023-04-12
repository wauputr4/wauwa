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
  return group;
  // }

  // return groupName;
}

function socketAndLog(key, io, slug, status) {
  //Io Socket & log
  io.emit("message", {
    id: key,
    text: status + " mendapatkan daftar " + slug,
  });
  console.log("api/" + slug + " | key : " + key);
}

module.exports = {
  findAndCheckClient: findAndCheckClient,
  findGroupByName: findGroupByName,
  socketAndLog: socketAndLog,
};
