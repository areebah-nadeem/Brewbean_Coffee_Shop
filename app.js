let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
let basketRouter = require('./routes/basket');
let productRouter = require('./routes/product');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');
const dbconfig = require('./dbconfig');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/product', productRouter);
app.use('/basket', basketRouter);
app.use(bodyParser.urlencoded({ extended: true }));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).send('Page not found');
});
// error handler
app.use(function(err, req, res, next) {
  res.status(500).send('Internal Server Error');
});


module.exports = app;