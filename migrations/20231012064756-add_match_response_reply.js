'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // add field matchh_response_reply to client_bots table
    await queryInterface.addColumn('client_bots', 'match_response_reply', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    //add field not_match_response_reply to client_bots table
    await queryInterface.addColumn('client_bots', 'not_match_response_reply', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    // remove field matchh_response_reply from client_bots table
    await queryInterface.removeColumn('client_bots', 'match_response_reply');

    // remove field not_match_response_reply from client_bots table
    await queryInterface.removeColumn('client_bots', 'not_match_response_reply');
  }
};
