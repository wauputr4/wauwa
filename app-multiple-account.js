const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fs = require('fs');
const { phoneNumberFormatter } = require('./helpers/formatter');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const port = process.env.PORT || 8001;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));


app.use(fileUpload({
  debug: false
}));

app.get('/', (req, res) => {
  res.sendFile('index-multiple-account.html', {
    root: __dirname
  });
});

const sessions = [];
const SESSIONS_FILE = './whatsapp-sessions.json';

const createSessionsFileIfNotExists = function() {
  if (!fs.existsSync(SESSIONS_FILE)) {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
      console.log('Sessions file created successfully.');
    } catch(err) {
      console.log('Failed to create sessions file: ', err);
    }
  }
}

createSessionsFileIfNotExists();

const setSessionsFile = function(sessions) {
  fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions), function(err) {
    if (err) {
      console.log(err);
    }
  });
}

const getSessionsFile = function() {
  return JSON.parse(fs.readFileSync(SESSIONS_FILE));
}

const createSession = function(id, description) {
  console.log('Creating session: ' + id);
  const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // <- this one doesn't works in Windows
        '--disable-gpu'
      ],
    },
    authStrategy: new LocalAuth({
      clientId: id
    })
  });

  client.initialize();

  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      io.emit('qr', { id: id, src: url });
      io.emit('message', { id: id, text: 'QR Code received, scan please!' });
    });
  });

  client.on('ready', () => {
    io.emit('ready', { id: id });
    io.emit('message', { id: id, text: 'Whatsapp is ready!' });

    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
    savedSessions[sessionIndex].ready = true;
    setSessionsFile(savedSessions);
  });

  client.on('authenticated', () => {
    io.emit('authenticated', { id: id });
    io.emit('message', { id: id, text: 'Whatsapp is authenticated!' });
  });

  client.on('auth_failure', function() {
    io.emit('message', { id: id, text: 'Auth failure, restarting...' });
  });

  client.on('disconnected', (reason) => {
    io.emit('message', { id: id, text: 'Whatsapp is disconnected!' });
    client.destroy();
    client.initialize();

    // Menghapus pada file sessions
    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
    savedSessions.splice(sessionIndex, 1);
    setSessionsFile(savedSessions);

    io.emit('remove-session', id);
  });

  // Tambahkan client ke sessions
  sessions.push({
    id: id,
    description: description,
    client: client
  });

  // Menambahkan session ke file
  const savedSessions = getSessionsFile();
  const sessionIndex = savedSessions.findIndex(sess => sess.id == id);

  if (sessionIndex == -1) {
    savedSessions.push({
      id: id,
      description: description,
      ready: false,
    });
    setSessionsFile(savedSessions);
  }
}

const init = function(socket) {
  const savedSessions = getSessionsFile();

  if (savedSessions.length > 0) {
    if (socket) {
      savedSessions.forEach((e, i, arr) => {
        arr[i].ready = false;
      });

      socket.emit('init', savedSessions);
    } else {
      savedSessions.forEach(sess => {
        createSession(sess.id, sess.description);
      });
    }
  }
}

init();

// Socket IO
io.on('connection', function(socket) {
  init(socket);

  socket.on('create-session', function(data) {
    console.log('Create session: ' + data.id);
    createSession(data.id, data.description);
  });
});

// Send message
app.post('/api/send-message', async (req, res) => {
  //console.log(req);

  const key = req.body.key;
  const phone_no = phoneNumberFormatter(req.body.phone_no);
  const message = req.body.message;

  // const client = sessions.find(sess => sess.id == key)?.client;
  const client = sessions.find(sess => sess.id == key) && sessions.find(sess => sess.id == key).client;

  // Make sure the key is exists & ready
  if (!client) {
    return res.status(422).json({
      status: false,
      message: `The key: ${key} is not found!`
    })
  }

  const isRegisteredNumber = await client.isRegisteredUser(phone_no);

  if (!isRegisteredNumber) {
    return res.status(422).json({
      status: false,
      message: 'The phone_no is not registered'
    });
  }

  client.sendMessage(phone_no, message)
  .then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  }).finally(() => {
    io.emit('message', { id: key, text: 'success send message : <br>'+message });
    console.log('/api/send-message key : '+key+' phone_no: '+phone_no+' message: '+message);
  });

});

//get chats
app.get('/api/chats', async (req, res) => {
  //get Params
  const { key } = req.query;

  console.log('key '+key);

  //get client session
  const client = sessions.find(sess => sess.id == key) && sessions.find(sess => sess.id == key).client;

  // Make sure the key is exists & ready
  if (!client) {
    return res.status(422).json({
      status: false,
      message: `The key: ${key} is not found!`
    })
  }

  // client.getChats()
  // .then(response => {
  //   const chats = response.map(chat => {
  //     return {
  //       id: chat.id.user,
  //       name: chat.name,
  //       isGroup: chat.isGroup
  //     };
  //   });

  //   res.status(200).json({
  //     status: true,
  //     response: chats
  //   });
  // })
  // .catch(err => {
  //   res.status(500).json({
  //     status: false,
  //     response: err
  //   });
  // })
  // .finally(() => {
  //   io.emit('message', { id: key, text: 'success get fetchMessages ' });
  //   console.log('/api/chats key : '+key);
  // });

  client.getChats({ limit: 5 })
  .then(response => {
    const chats = response.map(chat => {
      return {
        id: chat.id.user,
        name: chat.name,
        isGroup: chat.isGroup
      };
    });

    res.status(200).json({
      status: true,
      response: chats
    });
  })
  .catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  })
  .finally(() => {
    io.emit('message', { id: key, text: 'success get fetchMessages ' });
    console.log('/api/chats key : '+key);
  });



});

//get labels list
app.get('/api/labels', async (req, res) => {
  //get Params
  const { key } = req.query;

  console.log('key '+key);

  //get client session
  const client = sessions.find(sess => sess.id == key) && sessions.find(sess => sess.id == key).client;

  // Make sure the key is exists & ready
  if (!client) {
    return res.status(422).json({
      status: false,
      message: `The key: ${key} is not found!`
    })
  }

  client.getLabels()
  .then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  }).finally(() => {
    io.emit('message', { id: key, text: 'success get fetchMessages ' });
    console.log('/api/group-list key : '+key);
  });
  
});

server.listen(port, function() {
  console.log('App running on *: ' + port);
});