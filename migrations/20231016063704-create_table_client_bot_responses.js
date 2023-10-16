"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    //create table log_client_bot_responses with field session_id, session_label, request, response, status_code, status_string app_version, wwebjs_version, createdAt, updatedAt
    await queryInterface.createTable("log_client_bot_responses", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      session_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "sessions",
          key: "id",
        },
      },
      session_label: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      client_bot_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "client_bots",
          key: "id",
        },
      },
      request: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      //field reponse is json
      response: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      status_code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status_string: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      app_version: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      wwebjs_version: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  async down(queryInterface, Sequelize) {
    //drop table log_client_bot_responses
    await queryInterface.dropTable("log_client_bot_responses");
  },
};
