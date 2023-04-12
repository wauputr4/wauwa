module.exports = (io, sessions) => {
  const express = require("express");
  const router = express.Router();
  const {
    findAndCheckClient,
    findGroupByNameAsync,
    socketAndLog,
    findGroupBySlugInvite,
  } = require("../helpers/utils");
  const { phoneNumberFormatter } = require("../helpers/formatter");
  const { body, validationResult } = require("express-validator");

  // Endpoint untuk mendapatkan daftar check_number
  router.post("/check_number", async (req, res) => {
    // Ambil parameter
    const phone_no = phoneNumberFormatter(req.body.phone_no);
    const key = req.body.key;

    try {
      // Cari dan periksa client session
      const client = findAndCheckClient(key, sessions);
      const isRegisteredNumber = await client.isRegisteredUser(phone_no);
      socketAndLog(key, io, "check_number", "Success");

      if (!isRegisteredNumber) {
        return res
          .status(422)
          .header("Content-Type", "application/json")
          .send(JSON.stringify("not_exists"));
      } else {
        return res
          .status(200)
          .header("Content-Type", "application/json")
          .send(JSON.stringify("exists"));
      }
    } catch (err) {
      res.status(422).json({
        status: false,
        message: err.message,
      });

      socketAndLog(key, io, "check_number", "Failed");
    }
  });


  //Endpoint Send message Woowa
  router.post("/send_message", async (req, res) => {
    const key = req.body.key;
    const phone_no = phoneNumberFormatter(req.body.phone_no);
    const message = req.body.message;

    try {
      const client = findAndCheckClient(key, sessions);

      //checkNumber Register
      const isRegisteredNumber = await client.isRegisteredUser(phone_no);
      if (!isRegisteredNumber) {
        return res.status(422).json({
          status: false,
          message: "The phone_no is not registered",
        });
      }

      client
        .sendMessage(phone_no, message)
        .then((response) => {
          res.status(200).json({
            status: true,
            response: response,
          });
        })
        .catch((err) => {
          res.status(500).json({
            status: false,
            response: err.message,
          });
        })
        .finally(() => {
          socketAndLog(key, io, "send_message", "Success", JSON.stringify({
            phone_no: phone_no,
            message: message
          }));
        });
    } catch (err) {
      socketAndLog(key, io, "send_message", "Error", JSON.stringify({
        phone_no: phone_no,
        message: message
      }));

      res.status(422).json({
        status: false,
        message: err.message,
      });
    }
  });


  // Endpoint Send Group
  // Send message asyncronuze to group 
  // You can use chatID or group name, yea!
  router.post("/async_send_group", async (req, res) => {
    let chatId = req.body.id;
    const key = req.body.key;
    const message = req.body.message;
    const group_name = req.body.group_name;

    try {
      const client = findAndCheckClient(key, sessions);
      if (!chatId) {
        const group = await findGroupByNameAsync(group_name, client);
        chatId = group?.id?._serialized || (() => { throw new Error(`No group found with name: ${group_name}`) })();
      }
      const response = await client.sendMessage(chatId, message);

      socketAndLog(key, io, "async_send_group", "Success", JSON.stringify({
        group_name: group_name,
        message: message
      }));

      res.status(200).json({
        status: true,
        response: response,
      });
    } catch (err) {
      socketAndLog(key, io, "async_send_group", "Error", JSON.stringify({
        group_name: group_name,
        message: message
      }));

      res.status(500).json({
        status: false,
        response: err.message,
      });
    }
  });

  // Endpoint Send Group with Slug
  // Send message Syncronize to group with invited code whatsapp
  router.post("/send_message_group_id", [
    body("key").notEmpty(),
    body("message").notEmpty(),
    body("group_id").notEmpty(),
  ], async (req, res) => {

    const errors = validationResult(req).formatWith(({ msg }) => {
      return msg;
    });

    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped(),
      });
    }
    const key = req.body.key;
    const message = req.body.message;
    const group_id = req.body.group_id;

    try {
      const client = findAndCheckClient(key, sessions);

      const group = await findGroupBySlugInvite(group_id, client);
      const chatId = group?.id?._serialized || (() => { throw new Error(`No group found with id: ${group_id}`) })();

      const response = await client.sendMessage(chatId, message);
      socketAndLog(key, io, "send_message_group_id", "Success", JSON.stringify({
        group_id: group_id,
        message: message
      }));

      res.status(200).json({
        status: true,
        response: response,
      });
    } catch (err) {
      socketAndLog(key, io, "send_message_group_id", "Error", JSON.stringify({
        group_id: group_id,
        message: message
      }));

      res.status(500).json({
        status: false,
        response: err.message,
      });
    }
  });

  return router;
};
