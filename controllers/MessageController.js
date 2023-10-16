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
          const response = checkResponse(sess, bot, "match", message);
        } else {
          console.log("regex not match");
          const response = checkResponse(sess, bot, "not_match", message);
        }
      }
    }

    return true;
  };

  const checkResponse = (sess, bot, status, message) => {
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
      callBackUrlAxios(sess, bot, message);
    } else if (not_match_response_method === "url") {
      // if (!not_match_response) {
      //   console.log(`Error : ${not_match_response}`);
      //   return [not_match_response, not_match_response_method];
      // }
    }
  };

  const callBackUrl = (sess, bot, message) => {
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

  const callBackUrlFetch = async (sess, bot, message) => {
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

  // CallBackwithAxios
  const callBackUrlAxios = async (sess, bot, message) => {
    let recitation = message.body;
    //remove message.body with text in bot.format_slicing
    if (bot.format_slicing) {
      const regex = new RegExp(bot.format_slicing);
      recitation = message.body.replace(regex, "");
    }

    const axios = require("axios");
    let data = JSON.stringify({
      phone: message.from,
      recitation: recitation,
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

        if (response.message) {
          message.reply(` ${response.message} `);
        }

        //store log client bot
        const logClientBot = storeLogClientBot({
          sess: sess,
          bot: bot,
          message: message,
          response: response,
        });
      })
      .catch((error) => {
        let errorResponse = error.response;
        if (errorResponse) {
          console.error("Response Data:", errorResponse.data);
          console.error("Response Status:", errorResponse.status);

          if (errorResponse.data) {
            errorResponse.data.message
              ? message.reply(` ${errorResponse.data.message} `)
              : null;
          }
        } else {
          ///errorResponse with json
          errorResponse = error;
          console.error("Error Message:", errorResponse.message);
        }

        //store log client bot
        const logClientBot = storeLogClientBot({
          sess: sess,
          bot: bot,
          message: message,
          response: errorResponse,
        });
      });
  };

  //create method save store log client bot responses
  const storeLogClientBot = (data) => {
    const LogClientBotResponse = require("../models/LogClientBotResponse");

    let response = {
      session_id: data.sess.id,
      session_label: data.sess.key_name,
      client_bot_id: data.bot.id,
      request: data.message.body,
      response: data.response.data, // Extracting the data property from the response
      status_code: data.response.status,
      status_string: data.response.statusText,
    };

    try {
      const clientBotLog = LogClientBotResponse.create(response);

      return clientBotLog;
    } catch (error) {
      console.log(`Error saving log client bot: ${error}`);
      io.emit("message", {
        id: data.message.id,
        text: `Error saving log client bot: ${error.message}`,
      });
    }
  };

  return {
    handleAsBot,
  };
};

//module exports
// module.exports = { handleAsBot, io, sessions };
