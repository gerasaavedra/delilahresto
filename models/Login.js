import Sequelize from 'sequelize';
import db from '../config/db.js';

export const Login = db.define('users', {

    username: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    }
});

export default Login;