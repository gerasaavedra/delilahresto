import Sequelize from 'sequelize';
import db from '../config/db.js';

export const Products = db.define('products', {
    id: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    product_name: {
        type: Sequelize.STRING
    },
    price: {
        type: Sequelize.STRING
    },
    available: {
        type: Sequelize.BOOLEAN
    }
});

export default Products;