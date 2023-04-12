module.exports = (io, sessions) => {
  const express = require("express");
  const router = express.Router();
  const {
    findAndCheckClient,
    findGroupByName,
    socketAndLog,
  } = require("../helpers/utils");
  const { phoneNumberFormatter } = require("../helpers/formatter");
  const { body, validationResult } = require("express-validator");

  // Endpoint untuk mendapatkan daftar check_number
  router.post("/check_number", async (req, res) => {
    // Ambil parameter
    const phone_no = phoneNumberFormatter(req.body.phone_no);
    const key = req.body.key;
    console.log("key " + key);

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
      res.status(422).json({
        status: false,
        message: err.message,
      });

      socketAndLog(key, io, "send_message", "Error", JSON.stringify({
        phone_no: phone_no,
        message: message
      }));
    }
  });

  // Send message to group
  // You can use chatID or group name, yea!
  router.post(
    "/async_send_group",
    [
      body("id").custom((value, { req }) => {
        if (!value && !req.body.group_name) {
          throw new Error("Invalid value, you can use `id` or `group_name`");
        }
        return true;
      }),
      body("message").notEmpty(),
    ],
    async (req, res) => {
      const errors = validationResult(req).formatWith(({ msg }) => {
        return msg;
      });

      if (!errors.isEmpty()) {
        return res.status(422).json({
          status: false,
          message: errors.mapped(),
        });
      }

      let chatId = req.body.id;
      const key = req.body.key;
      const group_name = req.body.group_name;
      const message = req.body.message;

      try {
        const client = findAndCheckClient(key, sessions);

        // Find the group by name
        if (!chatId) {
          const group = await findGroupByName(group_name, client);
          if (group) {
            chatId = group.id._serialized;
          }
        }

        client
          .sendMessage(chatId, message)
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
          });
      } catch (err) {
        res.status(422).json({
          status: false,
          message: err.message,
        });

        socketAndLog(key, io, "send_message", "Error", JSON.stringify({
          group_name: group_name,
          message: message
        }));
      }


    }
  );

  return router;
};
