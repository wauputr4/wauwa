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

// Define model for users table
class User extends Model { }
User.init({
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    age: DataTypes.INTEGER,
    bio: DataTypes.TEXT,
    is_admin: DataTypes.BOOLEAN
}, { sequelize, modelName: 'users' });

// Export Sequelize connection and model
module.exports = {
    sequelize,
    User
};

