const { Sequelize, Model, DataTypes } = require('sequelize');
const config = require('../config/database');

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

// Define model for sessions table
class Session extends Model { }
Session.init({
    key_name: DataTypes.STRING,
    key_hash: DataTypes.STRING,
    description: DataTypes.TEXT,
    ready: DataTypes.BOOLEAN,
    number: DataTypes.STRING,
    platform: DataTypes.STRING,
    pushname: DataTypes.STRING,
    serialize_id: DataTypes.STRING,
    app_version: DataTypes.STRING,
    wwebjs_version: DataTypes.STRING,
    is_need_callback : DataTypes.BOOLEAN
}, { sequelize, modelName: 'sessions' });

// Export Sequelize connection and model
module.exports = {
    sequelize,
    Session
};