import config from './config/config.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import jsonWebToken from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import expressJwt from 'express-jwt';
import rateLimit from 'express-rate-limit';
import db from './config/db.js';
import session from 'express-session';

// traemos los modelos
import Products from './models/Products.js';
import Users from './models/Users.js';
import Login from './models/Login.js';
import Orders from './models/Orders.js';


const app = express();

// conectar DB
db.authenticate()
    .then(() => console.log('Base de datos conectada'))
    .catch(error => console.log(error));


// límite de peticiones 
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5
});

// variable para el manejo de sesiones
let currentSession;

// variable para manejar el login y logout
let loggedIn = false;



app.use(helmet());
app.use(cors());
app.use(limiter);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// session handling
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));


// jsonWebToken config
app.use(expressJwt({
    secret: `${config.PRIVATE_KEY}`,
    algorithms: ['sha1', 'RS256', 'HS256']
}).unless({
    path: ["/registration", "/login"]
}));



// Middlewares

async function singUp(req, res, next) {

    const errores = [];

    if (req.body.username.trim() === '') {
        errores.push({ msg: "El campo username esta vacio" })
    };

    if (req.body.password.trim() === '') {
        errores.push({ msg: "El campo password esta vacio" })
    };

    if (req.body.adress.trim() === '') {
        errores.push({ msg: "El campo adress esta vacio" })
    };

    if (req.body.fullname.trim() === '') {
        errores.push({ msg: "El campo fullname esta vacio" })
    };

    if (req.body.admin === null) {
        errores.push({ msg: "El campo admin no esta definido" })
    };

    if (errores.length > 0) {
        await res.status(400).send(errores);
    } else {
        next();
    };

};

function passwordLength(req, res, next) {
    if (req.body.password.length < 8) {
        res.status(411).send("La contraseña es muy corta, debe contener mínimo 8 caracteres.");
    } else {
        next();
    };
};

// verifica si el usuario ya existe o no
async function preExistingUser(req, res, next) {

    const userName = req.body.username;
    const exist = await Users.findOne({ where: { username: `${userName}` } });

    if (exist) {
        res.status(412).send({
            msg: "El nombre de usuario ya existe, por favor ingresar otro."
        });
    } else {
        next();
    };

};

// revisa si el username y el password son correctos
async function validateLogin(req, res, next) {

    const registeredUser = req.body.username;
    const registeredPassword = req.body.password;

    if (registeredUser && registeredPassword) {

        const registered = await Login.findOne({ where: { username: `${registeredUser}` } });

        // asigna el id del usuario logueado a la variable <currentSession>
        if (registered) {
            currentSession = registered.id;
        }

        if (!registered) return res.status(404).send({
            status: "404",
            msg: "Usuario no encontrado!"
        });
        const result = bcrypt.compareSync(registeredPassword, registered.password);
        if (!result) {
            res.status(401).send({
                status: "401",
                msg: "Contraseña inválida!"
            });
        } else {
            next();
        };
    } else {
        res.status(400).send({
            status: "400",
            msg: "Por favor ingrese Username y Password!"
        });
    };

};

// Controla si el usuario esta logueado o no
function verifySessionStatus(req, res, next) {

    if (currentSession === undefined) {
        loggedIn = false;
        res.status(406).send({
            status: "406",
            msg: "Por favor inicia sesión para realizar cualquier operación."
        })
    } else {
        loggedIn = true;
        next();
    };
};

// Verfica si el ID ingresado por el usuario es correcto
async function verifyProductId(req, res, next) {

    const existingId = req.params.id;
    const alreadyExist = await Products.findOne({ where: { id: `${existingId}` } });

    if (!alreadyExist) {
        res.status(404).send({
            msg: "El Id ingresado no existe en el listado de Productos."
        });
    } else {
        next();
    };
};

async function verifyOrderId(req, res, next) {

    const id = req.body.id;
    const orderToUpdate = await Orders.findOne({ where: { id: `${id}` } });

    if (!orderToUpdate) {
        res.status(404).send({
            msg: "El Id ingresado no corresponde a una Orden. Por favor verificar datos ingresados."
        });
    } else {
        next();
    };
};

// Cliente o Admin
async function validateUserPrivilege(req, res, next) {

    const defineUserCategory = await Users.findOne({ where: { id: `${currentSession}` } });
    const userCategory = defineUserCategory.admin;

    if (userCategory === 0) {
        res.send({
            isAdmin: false,
            msg: "No tienes permisos para realizar esta acción.",
            status: 401
        });
    } else {
        next();
    };
};

// Valida el status provisto es válido
function acceptedStatuses(req, res, next) {

    const status = req.body.order_status;

    if (status === "in_progress") {
        return next();
    } else if (status === "ready") {
        next();
    } else {
        res.status(406).send("Estado inválido, por favor revisa la documentación para mayor información.");
    };
};



// Registro
app.post('/registration', singUp, passwordLength, preExistingUser, async(req, res) => {

    const username = req.body.username;
    const passwordEncrypt = bcrypt.hashSync(req.body.password, 10);
    const adress = req.body.adress;
    const fullname = req.body.fullname;
    const admin = req.body.admin;

    try {
        const newUser = await Users.create({
            adress: adress,
            password: passwordEncrypt,
            fullname: fullname,
            username: username,
            admin: admin
        });
        res.status(200).json({
            operation: "Successful Operation",
            msg: `El usuario ${username} se registro correctamente.`
        });
    } catch (error) {
        res.status(406).send("Ocurrió un error, por favor intenta nuevamente.");
    };
});

// Login
app.post('/login', validateLogin, (req, res) => {

    // Obtenemos el token
    const user = req.body.username;
    const accessToken = jsonWebToken.sign({ user: user }, `${config.PRIVATE_KEY}`);

    res.status(200).send({
        msg: "Acceso garantizado!",
        User: user,
        access_token: accessToken
    });

    Users.findOne({ where: { username: `${user}` } }, () => (err, user) => {

        req.session.id = {
            userId: user.id,
            user: user
        }
    });
    //console.log(req.session.id);
    //console.log(currentSession);
});

// Autentica el usuario mediante su token
app.get("/authenticate", (req, res) => {

    let token = req.headers.authorization.split(" ")[1];
    let data = jsonWebToken.verify(token, `${config.PRIVATE_KEY}`);
    console.log(data);

    if (!data) {
        res.status(401).send("Invalid token");
    } else {
        res.status(200).send({
            msg: "GET Operación Exitosa",
            token,
            authenticated: "Usuario autenticado!"
        });
    };
});



// Obtener lista de productos
app.get('/products', async(req, res) => {

    const menu = [];

    const products = await Products.findAll();

    try {
        products.forEach(product => {
            let productId = product.id;
            let productName = product.product_name;
            let price = product.price;
            let available = product.available
            menu.push({
                productId,
                productName,
                price,
                available
            });
        });

        res.status(200).send({
            msg: "DelilahResto Menu",
            menu
        });
    } catch (error) {
        console.log(error);
        res.status(404).send("Ocurrió un error: ", error);
    };
});

// Crear nuevo producto
app.post('/products', verifySessionStatus, validateUserPrivilege, async(req, res) => {

    let product_name = req.body.product_name;
    let price = req.body.price;
    let available = req.body.available; // available - not available

    try {
        const newProduct = await Products.create({
            product_name: product_name,
            price: price,
            available: available
        });

        res.status(200).send(`Se agregó ${newProduct.product_name} a la lista de productos.`);

    } catch (error) {
        res.status(400).send("Ocurrió un error: ", error);
    };
});

// Actualiza lista de productos
app.put('/products', verifySessionStatus, validateUserPrivilege, async(req, res) => {

    let id = req.body.id;
    let name = req.body.product_name;
    let price = req.body.price;

    try {
        let response = await Products.update({ product_name: `${name}`, price: `${price}` }, {
            where: {
                id: `${id}`
            }
        });

        res.status(200).send("Lista de productos actualizada!");

    } catch (error) {
        res.status(400).send("El id ingresado no corresponde a un producto en la lista.");
    };
});

// Eliminar un producto por su id
app.delete('/products/:id', verifySessionStatus, verifyProductId, validateUserPrivilege, async(req, res) => {

    let id = req.params.id;

    if (id) {
        let response = await Products.destroy({
            where: {
                id: id
            }
        });

        res.status(200).send("Producto eliminado correctamente");
    } else {
        res.status(404).send("El Id ingresado no existe en el listado de Productos.");
    };
});


// Generar ordenes
app.post('/order', verifySessionStatus, async(req, res) => {

    let productsId = req.body.products_id;

    // convierte array de str a int
    let productsList = productsId.split(',').map(function(item) {
        return parseInt(item, 10);
    });

    // cantidad de productos en la orden
    let numberOfProducts = productsList.length;

    try {
        // SELECT * FROM users where id in (1,2,3,4,5);
        let order = await Products.findAll({
            where: {
                id: productsList
            }
        });


        let total = [];
        let ticket = []

        // Obtenemos el detalle de la orden
        let orderDetails = order.forEach(order => {
            let productId = order.id;
            let productName = order.product_name;
            let price = order.price;
            total.push(order.price);
            ticket.push({
                "productName": productName,
                "price": price
            });
            console.log(productId, productName, price);
        });

        // Convertimos el array de str a int
        let orderPrice = total.map(i => Number(i));

        // Sumamos todos los precios para obtener el total de la orden
        let numbers = orderPrice;
        let totalOrderPrice = numbers.reduce((a, b) => a + b, 0);

        console.log("Total: ", totalOrderPrice);

        if (currentSession != undefined) {
            // Guardamos la orden el la DB
            const newOrder = Orders.create({
                user_id: currentSession,
                total_products: `${numberOfProducts}`,
                total_price: `${totalOrderPrice}`
            });

            res.status(200).send({
                msg: 'Succesful Operation',
                total_products: `${numberOfProducts}`,
                order_details: ticket,
                total_price: `${totalOrderPrice}`
            });
        } else {
            res.status(511).send({
                msg: "Debes iniciar seción para realizar una orden."
            });
        };

    } catch (error) {
        res.status(404).send("Ocurrió un error: ", error);
    };

});

// actualiza el estado del pedido
app.put('/order_status', verifySessionStatus, validateUserPrivilege, verifyOrderId, acceptedStatuses, async(req, res) => {

    let orderId = req.body.id;
    let orderStatus = req.body.order_status;

    const updateOrder = await Orders.update({ status: `${orderStatus}` }, {
        where: {
            id: `${orderId}`
        }
    });

    res.status(200).send({
        msg: "Se modifico correctamente el estado de la orden.",
        new_status: `${orderStatus}`
    });

});


// obtiene todos los datos personales del usuario logueado
app.get('/account_settings', verifySessionStatus, async(req, res) => {

    const sessionId = currentSession;

    try {
        const userData = await Users.findAll({
            where: {
                id: sessionId
            }
        });

        res.status(200).send(userData);
    } catch (error) {
        console.log(error);
    };
});

// obtiene el listado de ordenes realizadas por el usuario logueado
app.get('/my_orders', verifySessionStatus, async(req, res) => {

    const sessionId = currentSession;

    try {
        const OrdersList = await Orders.findAll({
            where: {
                user_id: sessionId
            }
        });

        res.status(200).send(OrdersList);
    } catch (error) {
        res.send(error);
    };

});

// obtiene el listado completo de todas las ordenes - User Admin only
app.get('/all_orders', verifySessionStatus, validateUserPrivilege, async(req, res) => {

    const allOrders = await Orders.findAll();

    try {
        await allOrders.forEach(order => {
            let orderId = order.id;
            let user_id = order.user_id;
            let totalProducts = order.total_products;
            let totalPrice = order.total_price;
            let status = order.status;
            console.log({
                "order id": orderId,
                "user id": user_id,
                "total de productos": totalProducts,
                "total de la orden": totalPrice,
                "estado": status
            });
        });

        res.send("GET Successful Operation");
    } catch (error) {
        console.log(error);
        res.status(404).send("Ocurrió un error: ", error);
    };

});


// listen
console.log(`NODE_ENV = ${config.NODE_ENV}`);

app.listen(config.PORT, config.HOST, () => {
    console.log(`App listening on http://${config.HOST}:${config.PORT}`);
});