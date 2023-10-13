module.exports = (io, sessions) => {
  const SessionModel = require("../models/Session");
  const ClienBotModel = require("../models/ClientBot");
  const { findAndCheckClient } = require("../helpers/utils");
  const url = require("url");
  const http = require("http");

  async function handleAsBot(message, key) {
    const sess = await getSession(key);
    const client = findAndCheckClient(key, sessions);

    if (isNeedCalBack(sess)) {
      //getBot
      const trigger = await getBot(sess);
      const botTrigger = await botTriggerChecker(sess, trigger, message);
    }
  }

  const getSession = async (key_name) => {
    try {
      const session = await SessionModel.Session.findOne({
        where: { key_name },
      });

      return session;
    } catch (error) {
      console.log(`Error getting session id: ${error}`);
      io.emit("message", {
        id: key_name,
        text: ` Error getting session id: ${error.message} `,
      });
    }
  };

  const isNeedCalBack = (sess) => {
    if (sess.is_need_callback) {
      return true;
    } else {
      const message = `Session id: ${sess.key_name} is not need callback`;
      console.log(message);
      io.emit("message", { id: sess.key_name, text: message });
    }
  };

  const getBot = async (sess) => {
    try {
      const ClientBotAll = await ClienBotModel.ClientBot.findAll({
        where: { session_id: sess.id },
      });

      if (!ClientBotAll || ClientBotAll.length === 0) {
        const messageError = `No bot client found with session id: ${sess.key_name}`;
        console.log(messageError);
        io.emit("message", { id: sess.key_name, text: messageError });
      } else {
        return ClientBotAll;
      }
    } catch (error) {
      const messageError = `Error getting bot client: ${error.message}`;
      console.log(messageError);
      io.emit("message", { id: sess.key_name, text: messageError });
    }
  };

  const botTriggerChecker = async (sess, trigger, message) => {
    if (!trigger || trigger.length === 0) {
      const messageError = `No trigger found`;
      io.emit("message", { id: sess.key_name, text: messageError });
      return console.log(messageError);
    }

    for (const bot of trigger) {
      if (bot.method === "regex") {
        const regex = new RegExp(bot.format);
        if (regex.test(message.body)) {
          console.log("regex match");
          const response = checkResponse(bot, "match", message);
        } else {
          console.log("regex not match");
          const response = checkResponse(bot, "not_match", message);
        }
      }
    }

    return true;
  };

  const checkResponse = (bot, status, message) => {
    const {
      match_response_method,
      match_response,
      match_response_reply,
      not_match_response_method,
      not_match_response,
      not_match_response_reply,
    } = bot;

    if (status === "match" && match_response_method === "url") {
      if (!match_response) {
        console.log("Response Match is null");
        return [match_response, match_response_method];
      }

      if (match_response_reply) {
        message.reply(` ${match_response_reply} `);
      }

      console.log(`sending forward to : ${match_response}`);
      callBackUrlAxios(bot, message);
    } else if (not_match_response_method === "url") {
      // if (!not_match_response) {
      //   console.log(`Error : ${not_match_response}`);
      //   return [not_match_response, not_match_response_method];
      // }
    }
  };

  const callBackUrl = (bot, message) => {
    const data = JSON.stringify({
      phone: message.from,
      recitation: message.body,
      message_id: message.id.id,
    });

    const { hostname, path } = url.parse(bot.match_response);
    const options = {
      hostname,
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    const req = http.request(options, (res) => {
      console.log(`statusCode: ${res.statusCode}`);
      res.on("data", (d) => {
        process.stdout.write(d);
      });
    });

    req.on("error", (error) => {
      console.error(error);
    });

    req.write(data);
    req.end();
  };

  const callBackUrlFetch = async (bot, message) => {
    require("isomorphic-fetch");

    const data = JSON.stringify({
      phone: message.from,
      recitation: message.body,
    });

    const url = bot.match_response;

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
    };

    try {
      const response = await fetch(url, options);

      console.log(
        `statusCode: ${response.status} because ${response.statusText}`
      );

      if (response.status === 200) {
        const responseData = await response.json();
        //console log show data as json or not json
        console.log(responseData);
      } else {
        console.error("Request failed");
      }
    } catch (error) {
      console.error(error);
    }
  };

  //const CallBackwithAxios
  const callBackUrlAxios = async (bot, message) => {
    const axios = require("axios");
    let data = JSON.stringify({
      phone: message.from,
      recitation: message.body,
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: bot.match_response,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios
      .request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return {
    handleAsBot,
  };
};

//module exports
// module.exports = { handleAsBot, io, sessions };
