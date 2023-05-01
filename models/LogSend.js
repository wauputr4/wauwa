const { Sequelize, Model, DataTypes } = require('sequelize');
const config = require('../config/database');
const { Session } = require('./Session');

// Create Sequelize connection
const sequelize = new Sequelize(config.database, config.user, config.password, {
    host: config.host,
    dialect: config.dialect,
    // Other Sequelize options here
});

// Connect to database and start server
sequelize.authenticate()
    .then(() => {
        console.log('Connected to MySQL database!');
        return sequelize.sync();
    })
    .catch((error) => {
        console.error('Unable to connect to MySQL database:', error);
    });


// Define model for log_send table
class LogSend extends Model { }
LogSend.init({
    session_id: DataTypes.INTEGER,
    to: DataTypes.STRING,
    message: DataTypes.TEXT,
    method: DataTypes.STRING,
    response: DataTypes.TEXT,
    is_group: DataTypes.BOOLEAN,
    status: DataTypes.STRING,
    app_version: DataTypes.STRING,
    wwebjs_version: DataTypes.STRING,
}, { sequelize, modelName: 'log_send' });

// Define association with Session model
LogSend.belongsTo(Session, { foreignKey: 'session_id' });

// Export Sequelize connection and model
module.exports = {
    sequelize,
    LogSend,
};