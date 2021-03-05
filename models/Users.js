import Sequelize from 'sequelize';
import db from '../config/db.js';

export const Users = db.define('users', {
    id: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    adress: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    },
    fullname: {
        type: Sequelize.STRING
    },
    username: {
        type: Sequelize.STRING
    },
    admin: {
        type: Sequelize.TINYINT
    }
});

export default Users;