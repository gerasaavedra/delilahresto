DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS orders_details;

CREATE TABLE `products` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `product_name` varchar(255) DEFAULT NULL,
  `price` varchar(255) DEFAULT NULL,
  `available` tinyint(1) DEFAULT '1',
  UNIQUE KEY `id` (`id`)
);


CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `adress` varchar(255) DEFAULT NULL,
  `password` varchar(60) DEFAULT NULL,
  `fullname` varchar(60) DEFAULT NULL,
  `username` varchar(60) DEFAULT '',
  `admin` tinyint(1) DEFAULT '0',
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `username` (`username`)
);

CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `total_products` int(11) DEFAULT NULL,
  `total_price` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'in_progress',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
);

CREATE TABLE `orders_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `product_price` decimal(10,2) DEFAULT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `date_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `id` (`id`),
  KEY `product_id` (`product_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `orders_details_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `orders_details_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
);



INSERT INTO products (product_name, price, available) VALUES ('Ensalada Rusa', '600', 1);
INSERT INTO products (product_name, price, available) VALUES ('Hamburguesa Clasica', '350', 1);
INSERT INTO products (product_name, price, available) VALUES ('Sandwich veggie', '310', 1);
INSERT INTO products (product_name, price, available) VALUES ('Ensalada veggie', '340', 1);
INSERT INTO products (product_name, price, available) VALUES ('Focaccia', '300', 1);
INSERT INTO products (product_name, price, available) VALUES ('Sandwich focaccia', '440', 1);
INSERT INTO products (product_name, price, available) VALUES ('Ensalada focaccia', '700', 1);

INSERT INTO users (adress, password, fullname, username, admin) VALUES ('Calle falsa 123', '12345678', 'Juan Perez', 'Juani', TRUE);
