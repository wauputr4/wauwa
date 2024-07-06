const { Client, MessageMedia, LocalAuth, Label } = require("whatsapp-web.js");
const express = require("express");
const socketIO = require("socket.io");
const qrcode = require("qrcode");
const http = require("http");
const fs = require("fs");
const { phoneNumberFormatter } = require("./helpers/formatter");
const fileUpload = require("express-fileupload");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const SessionController = require("./controllers/SessionController.js");

const { findAndCheckClient, getLogTime } = require("./helpers/utils");
const appConfig = require("./config/app.js");
const port = `${appConfig.port}` || 8002;

const LogSendController = require("./controllers/LogSendController.js");

const ejs = require("ejs");
const puppeteer = require("puppeteer");

// Author @wauputra
// email : wauputr4@gmail.com

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(
  fileUpload({
    debug: false,
  })
);

const sessions = [];
const SESSIONS_FILE = "./whatsapp-sessions.json";

const createSessionsFileIfNotExists = function () {
  if (!fs.existsSync(SESSIONS_FILE)) {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
      console.log(getLogTime() + "Sessions file created successfully.");
    } catch (err) {
      console.log(getLogTime() + "Failed to create sessions file: ", err);
    }
  }
};

createSessionsFileIfNotExists();

const setSessionsFile = function (sessions) {
  fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions), function (err) {
    if (err) {
      console.log(getLogTime() + err);
    }
  });
};

//const getSessionsFile = function () {
//  return JSON.parse(fs.readFileSync(SESSIONS_FILE));
//};

const getSessionsFile = function () {
  try {
    const fileContent = fs.readFileSync(SESSIONS_FILE, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading sessions file:', error);
    return []; // Return an empty array in case of error
  }
};

const createSession = async function (id, description) {
  console.log(getLogTime() + "Creating session: " + id);
  // const browser = await puppeteer.launch({ headless: false });

  const wwebVersion = process.env.WWEBVERSION;
  console.log('wwebVersion :', wwebVersion);

  const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
      headless: true,
       args: [
         '--no-sandbox',
         '--disable-setuid-sandbox',
      //   '--disable-dev-shm-usage',
      //   '--disable-accelerated-2d-canvas',
      //   '--no-first-run',
      //   '--no-zygote',
      //   '--single-process', // <- this one doesn't works in Windows
      //   '--disable-gpu'
       ],
    },
    webVersionCache: {
        type: 'remote',
        remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
    },  
    authStrategy: new LocalAuth({
      clientId: id,
    }),
  });
  // const client = new Client({
  //   restartOnAuthFail: true,
  //   puppeteer: { browser },
  //   authStrategy: new LocalAuth({ clientId: id })
  // });

  try {
    client.initialize();
  } catch (error) {
    console.error("Error initialize client", error);
  }

  client.on("qr", (qr) => {
    console.log(getLogTime() + "QR Received", qr);
    qrcode.toDataURL(qr, (err, url) => {
      io.emit("qr", { id: id, src: url });
      io.emit("message", {
        id: id,
        text: getLogTime() + "QR Code received, scan please!",
      });
    });
  });

  client.on("ready", async () => {
    console.log(getLogTime() + "ID : " + id + " is ready");
    io.emit("ready", { id: id });
    io.emit("message", { id: id, text: getLogTime() + "Whatsapp is ready!" });

    //menyimpan sesi
    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex((sess) => sess.id == id);

    //createorupdate db session
    const clientInfo = client.info;
    const sessionData = {
      keyName: savedSessions[sessionIndex].id,
      description: savedSessions[sessionIndex].description,
      ready: true,
      number: clientInfo.me.user,
      platform: clientInfo.platform,
      pushname: clientInfo.pushname,
      serialize_id: clientInfo.me._serialized,
    };

    const sess = await SessionController.createOrUpdateSession(sessionData);

    try {
      savedSessions[sessionIndex].ready = true;
      savedSessions[sessionIndex].number = sess.number;
      savedSessions[sessionIndex].key_hash = sess.key_hash;
      savedSessions[sessionIndex].is_need_callback = sess.is_need_callback
        ? sess.is_need_callback
        : false;
      setSessionsFile(savedSessions);
    } catch (error) {
      console.log(
        getLogTime() + "Error updating session to sessions file: ",
        error
      );
    }
  });

  client.on("authenticated", () => {
    console.log(getLogTime() + "ID : " + id + " is authenticated");
    io.emit("authenticated", { id: id });
    io.emit("message", {
      id: id,
      text: getLogTime() + "Whatsapp is authenticated!",
    });
  });

  client.on("auth_failure", function () {
    console.log(getLogTime() + "ID : " + id + " is auth failure");
    io.emit("message", {
      id: id,
      text: getLogTime() + "Auth failure, restarting...",
    });
  });

  client.on("disconnected", (reason) => {
    console.log(getLogTime() + "ID : " + id + " is disconnected");
    io.emit("message", {
      id: id,
      text: getLogTime() + "Whatsapp is disconnected!",
    });
    client.destroy();
    client.initialize();

    // Menghapus pada file sessions
    //const savedSessions = getSessionsFile();
    //const sessionIndex = savedSessions.findIndex((sess) => sess.id == id);
    //savedSessions.splice(sessionIndex, 1);
    //setSessionsFile(savedSessions);

    io.emit("remove-session", id);
  });

  client.on("message", async (message) => {
    //jika savedSessions is_need_callback true maka akan di proses
    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex((sess) => sess.id == id);
    const isNeedCallback = savedSessions[sessionIndex].is_need_callback;

    if (isNeedCallback == true) {
      const MessageCtl = require("./controllers/MessageController")(
        io,
        sessions
      );
      const Message = await MessageCtl.handleAsBot(message, id);
    }
  });

  // Tambahkan client ke sessions
  sessions.push({
    id: id,
    description: description,
    client: client,
  });

  // Menambahkan session ke file
  const savedSessions = getSessionsFile();
  const sessionIndex = savedSessions.findIndex((sess) => sess.id == id);

  if (sessionIndex == -1) {
    savedSessions.push({
      id: id,
      description: description,
      ready: false,
    });
    setSessionsFile(savedSessions);
  }
};

// const init = function (socket) {
//   const savedSessions = getSessionsFile();

//   if (savedSessions.length > 0) {
//     if (socket) {
//       savedSessions.forEach((e, i, arr) => {
//         // arr[i].ready = false;
//       });
//       socket.emit("init", savedSessions);
//     } else {
//       savedSessions.forEach((sess) => {
//         createSession(sess.id, sess.description);
//       });
//     }
//   }
// };
const init = function (socket) {
  const savedSessions = getSessionsFile();

  if (savedSessions.length > 0) {
    if (socket && socket.emit) {
      savedSessions.forEach((e, i, arr) => {
        // arr[i].ready = false;
      });
    }

    // Move the emit outside of the if condition
    if (socket && socket.emit) {
      socket.emit("init", savedSessions);
    }

    // Execute this block regardless of whether socket is defined or not
    else {
      savedSessions.forEach((sess) => {
        createSession(sess.id, sess.description);
      });
    }
  }
};

init();

// Socket IO
io.on("connection", function (socket) {
  init(socket);

  socket.on("create-session", function (data) {
    console.log(getLogTime() + "Create session: " + data.id);
    createSession(data.id, data.description);
  });
});

//Endpoint Login QR & get Status
// app.get('/', (req, res) => {
//   res.sendFile('index-multiple-account.html', {
//     root: __dirname
//   });
// });

app.get("/", (req, res) => {
  res.redirect("/list");
});

// set the view engine to ejs
app.set("views", "./views");
app.set("view engine", "ejs");

app.get("/list", (req, res) => {
  res.render("session-list");
});

app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Call the login function from the UserController
  const user = await UserController.login(username, password);

  if (user) {
    // User logged in successfully
    res.status(200).json({ message: "Login successful", user: user });
  } else {
    // Invalid username or password
    res.status(401).json({ message: "Invalid username or password" });
  }
});

app.get("/list/:slug", async (req, res) => {
  const slug = req.params.slug;
  const savedSessions = getSessionsFile();
  const sessionIndex = savedSessions.findIndex((sess) => sess.id == slug);

  //get Session Detail from db with getSessionId on SessionController
  const SessionController = require("./controllers/SessionController");
  const Session = await SessionController.getSessionInfo(slug);

  //jika hasil dari Session tidak ada maka akan 404
  if (!Session) {
    return res.status(404).json({
      status: false,
      message: getLogTime() + `The key: ${slug} is not found`,
    });
  }

  const LogSendController = require("./controllers/LogSendController");
  const LogSend = await LogSendController.getLogSendsByKeyName(slug);

  // console.log('LogSend : ', LogSend);

  res.render("session-detail", {
    session: savedSessions[sessionIndex],
    logsend: LogSend,
    varSession: Session,
  });
});

//Endpoint get chats
app.get("/api/chats", async (req, res) => {
  //get Params
  const { key } = req.query;
  console.log(getLogTime() + "key " + key);

  //get client session
  const client =
    sessions.find((sess) => sess.id == key) &&
    sessions.find((sess) => sess.id == key).client;

  // Make sure the key is exists & ready
  if (!client) {
    return res.status(422).json({
      status: false,
      message: getLogTime() + `The key: ${key} is not found!`,
    });
  }

  client
    .getChats()
    .then((response) => {
      const chats = response.map((chat) => {
        return {
          id: chat.id.user,
          name: chat.name,
          isGroup: chat.isGroup,
          id_serialized: chat.id._serialized,
          detail: chat,
        };
      });

      res.status(200).json({
        status: true,
        response: chats,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        response: err,
      });
    })
    .finally(() => {
      io.emit("message", {
        id: key,
        text: getLogTime() + "success get getChats ",
      });
      console.log(getLogTime() + "/api/chats key : " + key);
    });
});

//Endpoint get labels list
app.get("/api/labels", async (req, res) => {
  //get Params
  const { key } = req.query;
  console.log(getLogTime() + "key " + key);

  //get client session
  const client =
    sessions.find((sess) => sess.id == key) &&
    sessions.find((sess) => sess.id == key).client;

  // Make sure the key is exists & ready
  if (!client) {
    return res.status(422).json({
      status: false,
      message: getLogTime() + `The key: ${key} is not found!`,
    });
  }

  client
    .getLabels()
    .then((response) => {
      res.status(200).json({
        status: true,
        response: response,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        response: err,
      });
    })
    .finally(() => {
      io.emit("message", {
        id: key,
        text: getLogTime() + "success get labels ",
      });
      console.log(getLogTime() + "/api/labels key : " + key);
    });
});

//Endpoint get chats by label
app.get("/api/label/chats", async (req, res) => {
  //get Params
  const { key, labelid } = req.query;
  console.log(getLogTime() + "key " + key);

  //get client session
  const client =
    sessions.find((sess) => sess.id == key) &&
    sessions.find((sess) => sess.id == key).client;

  // Make sure the key is exists & ready
  if (!client) {
    return res.status(422).json({
      status: false,
      message: getLogTime() + `The key: ${key} is not found!`,
    });
  }

  client
    .getChatsByLabelId(labelid)
    .then((response) => {
      const chats = response.map((chat) => {
        return {
          id: chat.id.user,
          name: chat.name,
          isGroup: chat.isGroup,
          id_serialized: chat.id._serialized,
          detail: chat,
        };
      });

      res.status(200).json({
        status: true,
        response: chats,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        response: err,
      });
    })
    .finally(() => {
      io.emit("message", {
        id: key,
        text: getLogTime() + "success get getChats by label ",
      });
      console.log(getLogTime() + "/api/label/chats key : " + key);
    });
});

const woowaImpersonateRouter = require("./routes/woowaImpersonate")(
  io,
  sessions
);
app.use("/api", woowaImpersonateRouter);

const getContactsRouter = require("./routes/getContacts")(io, sessions);
app.use("/api", getContactsRouter);

app.post("/api/get_group", async (req, res) => {
  // Ambil parameter
  const key = req.body.key;
  const groupId = req.body.groupId;

  try {
    // Cari dan periksa client session
    const client = findAndCheckClient(key, sessions);

    // Find the group by ID
    const group = await client.getInviteInfo(groupId);

    if (!group) {
      res.status(500).json({
        status: false,
        message: getLogTime() + `No group found with id: ${groupId}`,
      });
    } else {
      // socketAndLog(key, io, "get_group", "Success");
      res.status(200).json({
        status: true,
        response: group,
      });
    }
  } catch (err) {
    res.status(422).json({
      status: false,
      message: getLogTime() + err.message,
    });
    // socketAndLog(key, io, "check_number", "Failed");
  }
});

//route delete client and session
app.delete("/api/client", async (req, res) => {
  try {
    //get Params
    const key = req.body.key;
    console.log(getLogTime() + "key : " + key + " is deleted");

    //get client session
    const client =
      sessions.find((sess) => sess.id == key) &&
      sessions.find((sess) => sess.id == key).client;
    client.destroy();
    client.initialize();

    // Menghapus pada file sessions
    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex((sess) => sess.id == key);
    savedSessions.splice(sessionIndex, 1);
    setSessionsFile(savedSessions);

    io.emit("remove-session", key);

    //return
    res.status(200).json({
      status: true,
      message: getLogTime() + "success delete client and session",
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

server.listen(port, function () {
  console.log(getLogTime() + "App running on *: " + port);
});
