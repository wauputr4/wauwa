// models/LogClientBotResponse.js

const { Sequelize, Model, DataTypes } = require("sequelize");
const config = require("../config/database");
const { Session } = require("./Session");
const { ClientBot } = require("./ClientBot");

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

class LogClientBotResponse extends Model {}
LogClientBotResponse.init(
  {
    session_id: DataTypes.INTEGER,
    session_label: DataTypes.STRING,
    client_bot_id: DataTypes.INTEGER,
    request: DataTypes.TEXT,
    response: DataTypes.JSON,
    status_code: DataTypes.STRING,
    status_string: DataTypes.STRING,
  },
  { sequelize, modelName: "log_client_bot_responses" }
);

// Define association with Session and ClientBot models
LogClientBotResponse.belongsTo(Session, { foreignKey: "session_id" });
LogClientBotResponse.belongsTo(ClientBot, { foreignKey: "client_bot_id" });

// Export the model class
module.exports = LogClientBotResponse;
