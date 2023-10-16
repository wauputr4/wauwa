"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    //add field format_slicing to client_bots
    await queryInterface.addColumn("client_bots", "format_slicing", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    //remove field format_slicing from client_bots
    await queryInterface.removeColumn("client_bots", "format_slicing");
  },
};
