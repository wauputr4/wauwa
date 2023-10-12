const { Sequelize, Model, DataTypes } = require("sequelize");
const config = require("../config/database");
const { Session } = require("./Session");

// Create Sequelize connection
const sequelize = new Sequelize(config.database, config.user, config.password, {
  host: config.host,
  dialect: config.dialect,
  // Other Sequelize options here
});

// Connect to database and start server
sequelize
  .authenticate()
  .then(() => {
    console.log("Connected to MySQL database!");
    return sequelize.sync();
  })
  .catch((error) => {
    console.error("Unable to connect to MySQL database:", error);
  });

// Define model for log_send table
class ClientBot extends Model {}
ClientBot.init(
  {
    session_id: DataTypes.INTEGER,
    session_label: DataTypes.STRING,
    method: DataTypes.STRING,
    format: DataTypes.STRING,
    not_match_response_method: DataTypes.STRING,
    not_match_response: DataTypes.TEXT,
    not_match_response_reply: DataTypes.TEXT,
    match_response_method: DataTypes.STRING,
    match_response: DataTypes.TEXT,
    match_response_reply: DataTypes.TEXT,
    app_version: DataTypes.STRING,
    wwebjs_version: DataTypes.STRING,
  },
  { sequelize, modelName: "client_bots" }
);

// Define association with Session model
ClientBot.belongsTo(Session, { foreignKey: "session_id" });

// Export Sequelize connection and model
module.exports = {
  sequelize,
  ClientBot,
};
