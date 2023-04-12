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


//Cari Group Berdasarkan Nama
async function findGroupByNameAsync(name, client) {
  const chats = await client.getChats();
  const group = chats.find(
    (chat) => chat.isGroup && chat.name.toLowerCase() == name.toLowerCase()
  );

  if (!group) {
    throw new Error(`No group found with name: ${name}`);
  }

  return group;
}


//Cari Group Berdasarkan Slug Invited Code
async function findGroupBySlugInvite(slug, client) {
  const group = await client.getInviteInfo(slug);

  if (group.membershipApprovalMode == true) {
    throw new Error(`You are not joined with group ${group.subject}`);
  }

  return group;
}



//Log Enpoint & IO
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
  console.log(new Date().toLocaleString() + " | " + status + " api/" + slug + " | key : " + key);
}

module.exports = {
  findAndCheckClient: findAndCheckClient,
  findGroupByNameAsync: findGroupByNameAsync,
  socketAndLog: socketAndLog,
  findGroupBySlugInvite: findGroupBySlugInvite
};
