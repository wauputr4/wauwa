module.exports = (io,sessions) => {
    const express = require('express');
    const router = express.Router();
    const { findAndCheckClient, findGroupByName } = require('../helpers/utils');
    const { phoneNumberFormatter } = require('../helpers/formatter');
    const { body, validationResult } = require('express-validator');

    // Endpoint untuk mendapatkan daftar check_number
    router.post('/check_number', async (req, res) => {
        // Ambil parameter
        const phone_no = phoneNumberFormatter(req.body.phone_no);
        const key = req.body.key;
        console.log('key '+key);
    
        try {
            // Cari dan periksa client session
            const client = findAndCheckClient(key,sessions);
            const isRegisteredNumber = await client.isRegisteredUser(phone_no);
            
            //Io Socket & log
            io.emit('message', { id: key, text: 'Berhasil mendapatkan daftar check_number ' });
            console.log('/api/check_number key : '+key);

            if (!isRegisteredNumber) {
                return res.status(422).header('Content-Type', 'application/json').send(JSON.stringify('not_exists'));
            } else {
                return res.status(200).header('Content-Type', 'application/json').send(JSON.stringify('exists'));
            }
        } catch (err) {
            res.status(422).json({
                status: false,
                message: err.message
            });

            //Io Socket & log
            io.emit('message', { id: key, text: 'Error gagal check_number ' });
            console.log('/api/check_number key : '+key);
        }
  });

  //Endpoint Send message Woowa
  router.post('/send_message', async (req, res) => {
    const key = req.body.key;
    const phone_no = phoneNumberFormatter(req.body.phone_no);
    const message = req.body.message;
    const client = findAndCheckClient(key,sessions);

    // Make sure the key is exists & ready
    if (!client) {
        return res.status(422).json({
            status: false,
            message: `The key: ${key} is not found!`
        })
    }

    //checkNumber Register
    const isRegisteredNumber = await client.isRegisteredUser(phone_no);
    if (!isRegisteredNumber) {
        return res.status(422).json({
            status: false,
            message: 'The phone_no is not registered'
        });
    }

    try{
        client.sendMessage(phone_no, message)
            .then(response => {
                res.status(200).json({
                    status: true,
                    response: response
                });
                // res.status(422).header('Content-Type', 'application/json')
                // .send(JSON.stringify('not_exists'));

            }).catch(err => {
                res.status(500).json({
                    status: false,
                    response: err
                });
            }).finally(() => {
                io.emit('message', { id: key, text: 'success send_message : '+message });
                console.log('/api/send_message key : '+key+' phone_no: '+phone_no+' message: '+message);
            });
    } catch (err) {
        res.status(422).json({
            status: false,
            message: err.message
        });

        //Io Socket & log
        io.emit('message', { id: key, text: 'Error gagal mengirim pesan' });
        console.log('error /api/send_message key : '+key+' phone_no: '+phone_no+' message: '+message);
    }
  });

// Send message to group
// You can use chatID or group name, yea!
router.post('/async_send_group', [
    body('id').custom((value, { req }) => {
      if (!value && !req.body.group_name) {
        throw new Error('Invalid value, you can use `id` or `group_name`');
      }
      return true;
    }),
    body('message').notEmpty(),
  ], async (req, res) => {
    const errors = validationResult(req).formatWith(({
      msg
    }) => {
      return msg;
    });
  
    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped()
      });
    }
  
    let chatId = req.body.id;
    const key = req.body.key;
    const group_name = req.body.group_name;
    const message = req.body.message;
    const client = findAndCheckClient(key,sessions);

    // Make sure the key is exists & ready
    if (!client) {
        return res.status(422).json({
            status: false,
            message: `The key: ${key} is not found!`
        })
    }
  
    // Find the group by name
    if (!chatId) {
      const group = await findGroupByName(group_name,client);
      if (!group) {
        return res.status(422).json({
          status: false,
          message: 'No group found with name: ' + group_name
        });
      }
      chatId = group.id._serialized;
    }
  
    client.sendMessage(chatId, message).then(response => {
      res.status(200).json({
        status: true,
        response: response
      });
    }).catch(err => {
      res.status(500).json({
        status: false,
        response: err
      });
    });

  });

  return router;
}
