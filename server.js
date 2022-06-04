const express = require('express');
const server = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectToDB = require('./config/db');
const { setUser } = require('./middleware/setUser');

server.use(express.json());
server.use(cookieParser());
server.use(cors({ origin: true }));
server.use(setUser);

connectToDB();

const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const productsRoutes = require('./routes/products');
const stripeRoutes = require('./routes/stripeEvents');

server.use('/api/auth', authRoutes);
server.use('/api/products', productsRoutes);
server.use('/api/orders', ordersRoutes);
server.use('/api/stripe/', stripeRoutes);

server.get('/', (req, res) => {
  res.send('home');
});

const port = process.env.PORT || 5000;
server.listen(port, '0.0.0.0', () => console.log(`Server running at ${port}`));
