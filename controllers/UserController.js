const UserModel = require('../models/User');
const bcrypt = require('bcrypt');

async function getUserById(userId) {
    try {
        const user = await UserModel.User.findByPk(userId)
        if (user) {
            return user;
        } else {
            console.log(`User with id ${userId} not found.`);
            return null;
        }
    } catch (error) {
        console.error(`Error getting user with id ${userId}:`, error);
    }
}

async function getAllUsers() {
    try {
        const users = await UserModel.User.findAll();
        return users;
    } catch (error) {
        console.error('Error getting all users:', error);
    }
}


async function login(username, password) {
    try {
        // Find user with matching username
        const user = await UserModel.User.findOne({
            where: { username: username }
        });

        if (user) {
            // Compare the provided password with the stored password hash
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                console.log(`User "${username}" logged in successfully.`);
                return user;
            } else {
                console.log(`Incorrect password for user "${username}".`);
                return null;
            }
        } else {
            console.log(`User "${username}" not found.`);
            return null;
        }
    } catch (error) {
        console.error('Error during login:', error);
    }
}


module.exports = { getUserById, getAllUsers, login };