const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fs = require('fs');
const { phoneNumberFormatter } = require('./helpers/formatter');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const port = process.env.PORT || 8002;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const { findAndCheckClient } = require('./helpers/utils');

// Author @wauputra
// email : wauputr4@gmail.com

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.use(fileUpload({
  debug: false
}));

const sessions = [];
const SESSIONS_FILE = './whatsapp-sessions.json';

const createSessionsFileIfNotExists = function () {
  if (!fs.existsSync(SESSIONS_FILE)) {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
      console.log('Sessions file created successfully.');
    } catch (err) {
      console.log('Failed to create sessions file: ', err);
    }
  }
}

createSessionsFileIfNotExists();

const setSessionsFile = function (sessions) {
  fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions), function (err) {
    if (err) {
      console.log(err);
    }
  });
}

const getSessionsFile = function () {
  return JSON.parse(fs.readFileSync(SESSIONS_FILE));
}

const createSession = function (id, description) {
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
    console.log('ID : ' + id + ' is ready');
    io.emit('ready', { id: id });
    io.emit('message', { id: id, text: 'Whatsapp is ready!' });

    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
    savedSessions[sessionIndex].ready = true;
    setSessionsFile(savedSessions);
  });

  client.on('authenticated', () => {
    console.log('ID : ' + id + ' is authenticated');
    io.emit('authenticated', { id: id });
    io.emit('message', { id: id, text: 'Whatsapp is authenticated!' });
  });

  client.on('auth_failure', function () {
    console.log('ID : ' + id + ' is auth failure');
    io.emit('message', { id: id, text: 'Auth failure, restarting...' });
  });

  client.on('disconnected', (reason) => {
    console.log('ID : ' + id + ' is disconnected');
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

  const axios = require('axios');
  const openaiApiKey = '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'; // ganti dengan kunci API Anda
  const openaiApiUrl = 'https://api.openai.com/v1/';

  function generateResponse(prompt) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    };

    const data = {
      "model": "gpt-3.5-turbo",
      "messages": [{ "role": "user", "content": prompt }]
    };

    return axios.post(`${openaiApiUrl}/chat/completions`, data, { headers: headers })
      .then(response => {
        const answer = response.data.choices[0].text.trim();
        return answer;
      })
      .catch(error => {
        console.log(error);
        return 'Maaf, terjadi kesalahan dalam mengambil respons dari ChatGPT : ' + error;
      });
  }

  client.on('message', msg => {
    if (msg.body == '!gpt') {
      const prompt = 'Halo ChatGPT, apa kabar?'; // ganti prompt sesuai keinginan Anda
      generateResponse(prompt)
        .then(response => {
          msg.reply(response);
        })
        .catch(error => {
          console.log(error);
          msg.reply('ada error : ' + error);
        });
    }
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

const init = function (socket) {
  const savedSessions = getSessionsFile();

  if (savedSessions.length > 0) {
    if (socket) {
      savedSessions.forEach((e, i, arr) => {
        // arr[i].ready = false;
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
io.on('connection', function (socket) {
  init(socket);

  socket.on('create-session', function (data) {
    console.log('Create session: ' + data.id);
    createSession(data.id, data.description);
  });
});

//Endpoint Login QR & get Status
app.get('/', (req, res) => {
  res.sendFile('index-multiple-account.html', {
    root: __dirname
  });
});

//Endpoint get chats
app.get('/api/chats', async (req, res) => {
  //get Params
  const { key } = req.query;
  console.log('key ' + key);

  //get client session
  const client = sessions.find(sess => sess.id == key) && sessions.find(sess => sess.id == key).client;

  // Make sure the key is exists & ready
  if (!client) {
    return res.status(422).json({
      status: false,
      message: `The key: ${key} is not found!`
    })
  }

  client.getChats()
    .then(response => {
      const chats = response.map(chat => {
        return {
          id: chat.id.user,
          name: chat.name,
          isGroup: chat.isGroup,
          id_serialized: chat.id._serialized
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
      io.emit('message', { id: key, text: 'success get getChats ' });
      console.log('/api/chats key : ' + key);
    });
});

//Endpoint get labels list
app.get('/api/labels', async (req, res) => {
  //get Params
  const { key } = req.query;
  console.log('key ' + key);

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
      io.emit('message', { id: key, text: 'success get labels ' });
      console.log('/api/labels key : ' + key);
    });

});

const woowaImpersonateRouter = require('./routes/woowaImpersonate')(io, sessions);
app.use('/api', woowaImpersonateRouter);

const getContactsRouter = require('./routes/getContacts')(io, sessions);
app.use('/api', getContactsRouter);



server.listen(port, function () {
  console.log('App running on *: ' + port);
});