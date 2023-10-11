// messageController.js

  function handlePing(message) {
    if (message.body === '!ping') {
      message.reply('pong');
    }
  }
  
  module.exports = { handlePing };
  