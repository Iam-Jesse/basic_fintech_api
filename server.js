const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const passport = require('passport');
const session = require('express-session');

//database config
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, 
  socketTimeoutMS: 45000
};
mongoose.connect(process.env.CONN, options).
catch(error => {
  //handle errors
  console.log(error);
});

require('./models/User');
require('./models/Transaction');
require('./models/Bank');

const userRoutes = require('./routes/user');
const transactionRoutes = require('./routes/transaction');
const bankRoutes = require('./routes/bank');
const initializePassport = require('./config/passport');

const app = express();
const port = process.env.PORT;

//configure helmet
app.use(helmet());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

initializePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use('/', userRoutes);
app.use('/transaction', transactionRoutes);
app.use('/bank', bankRoutes);

app.listen(port, () => {
  console.log('Server is listening!');
});