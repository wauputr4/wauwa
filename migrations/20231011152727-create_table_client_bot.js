'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    //create table client_bots 
    //the field is : id, session_id, session_label, method, format, not_match_response_method, not_match_response, match_response_method, match_response, app_version, wwebjs_version, createdAt, updatedAt
   //session id reference to sessions table, not_match_response is text type not varchar, match_response is text type not varchar
    await queryInterface.createTable('client_bots', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      session_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'sessions',
          key: 'id'
        }
      },
      session_label: {
        type: Sequelize.STRING
      },
      method: {
        type: Sequelize.STRING
      },
      format: {
        type: Sequelize.STRING
      },
      not_match_response_method: {
        type: Sequelize.STRING
      },
      not_match_response: {
        type: Sequelize.TEXT
      },
      match_response_method: {
        type: Sequelize.STRING
      },
      match_response: {
        type: Sequelize.TEXT
      },
      app_version: {
        type: Sequelize.STRING
      },
      wwebjs_version: {
        type: Sequelize.STRING
      },
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      }
    });


  },

  async down (queryInterface, Sequelize) {
    //drop table client_bot
    await queryInterface.dropTable('client_bot');
  }
};
