module.exports = (io, sessions) => {

  const SessionModel = require('../models/Session');
  const ClienBotModel = require('../models/ClientBot');
  const { findAndCheckClient } = require("../helpers/utils");
  const url = require('url');
  const http = require('http');

  async function handleAsBot(message, key) {
      //console.log('ID : ' + key + ' message : ' + message.body);
      //io.emit('message', { id: key, text: message.body });

      //first get session from database
      const sess = await getSession(key);
      const client = findAndCheckClient(key,sessions);

      //isneedcallback
      if(isNeedCalBack(sess)){
        //getBot
        const trigger = await getBot(sess);
        const botTrigger = await botTriggerChecker(sess,trigger, message);
      }
        
  }

  async function getSession(key_name){
    try{
        const session = await SessionModel.Session.findOne({
            where: { key_name: key_name }
        });

      return session;
    }catch(error){
      console.log('Error getting session id:', error);
      io.emit('message', { id: key_name, text: ` Error getting session id: ${error.message} ` });
      //throw new Error(`Error getting session id: ${error.message}`);
    }
    
  }

  function isNeedCalBack(sess){
      if(sess.is_need_callback){
        return true;
      }else{
        const message = `Session id: ${sess.key_name} is not need callback`;
        console.log(message);
        io.emit('message', { id: sess.key_name, text: message });
        //throw new Error(message);
      }
  }

    async function getBot(sess){
      try{
        //get all data by session id
        const ClientBotAll = await ClienBotModel.ClientBot.findAll({
            where: { session_id: sess.id }
        });

        //if client bot all is null or empty then return false
        if(!ClientBotAll || ClientBotAll.length == 0){
            const messageError = `No bot client found with session id: ${sess.key_name}`;
            console.log(messageError);
            //throw new Error(messageError);
            io.emit('message', { id: sess.key_name, text: messageError });
        }else{
          return ClientBotAll;
        }
    }catch(error){
        //console log, thrown error, io emit error then return false
        const messageError = `Error getting bot client: ${error.message}`;
        console.log(messageError);
        io.emit('message', { id: sess.key_name, text: messageError });
        //throw new Error(messageError);
    }
  }

  async function botTriggerChecker(sess,trigger, message){
    //if trigger is null or empty then return no trigger found
    if(!trigger || trigger.length == 0){
      const messageError = `No trigger found`;
      io.emit('message', { id: sess.key_name, text: messageError });
      return console.log(messageError);
      //throw new Error(messageError);
    }

    //foreach of trigger
    trigger.forEach(async function(bot){

      // if bot method is regex then return regex match (format in bot.format) with message
      if(bot.method == 'regex'){
          const regex = new RegExp(bot.format);
          if(regex.test(message.body)){
              console.log('regex match');
              const response = responseMethod(bot, 'match', message);
          }else{
              console.log('regex not match');
              const response = responseMethod(bot, 'not_match', message);
          }
      }

    });
    return true;
  }

  function responseMethod(bot, status, message){
    if(status == 'match'){
      //if bot.match_response_method is url then return bot.match_response if else bot.match_response
      if(bot.match_response_method == 'url'){
          const urlObj = url.parse(bot.match_response);
          message.reply('Kami segera merekam hafalanmu');
          console.log('sending forward to ' + bot.match_response);

          // Send callback
          const data = JSON.stringify({
            phone: message.from,
            recitation: message.body,
            message_id: message.id.id,
          });

          const options = {
            hostname: urlObj.hostname,
            path: urlObj.path,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': data.length
            }
          };

          //process send request
          const req = http.request(options, res => {
            console.log(`statusCode: ${res.statusCode}`);
            res.on('data', d => {
              process.stdout.write(d);
            });
          });
    
          //procc error
          req.on('error', error => {
            console.error(error);
          });
    
          req.write(data);
          req.end();

      }
    }else{
      if(bot.not_match_response_method == 'url'){
        // return bot.not_match_response;
        console.log('Error : ' + bot.not_match_response);
        return [bot.not_match_response, bot.not_match_response_method];
      }
    }

  }



  return {
    handleAsBot,
  };

}
  

//module exports
// module.exports = { handleAsBot, io, sessions };
  