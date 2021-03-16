import Sequelize from 'sequelize';
import db from '../config/db.js';

export const OrderDetails = db.define('orders_details', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    product_id: {
        type: Sequelize.INTEGER,
        foreignKey: true
    },
    order_id: {
        type: Sequelize.INTEGER,
        foreignKey: true
    },
    product_price: {
        type: Sequelize.DECIMAL
    },
    product_name: {
        type: Sequelize.STRING
    }
});

export default OrderDetails;