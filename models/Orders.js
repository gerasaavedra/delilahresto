import Sequelize from 'sequelize';
import db from '../config/db.js';

export const Orders = db.define('orders', {
    id: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    user_id: {
        type: Sequelize.STRING,
        foreignKey: true
    },
    total_products: {
        type: Sequelize.INTEGER
    },
    total_price: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.STRING
    }
});

export default Orders;