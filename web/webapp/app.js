var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const session = require('express-session');
const sessionPgStrategy = require('connect-pg-simple')(session);
var mustache = require('mustache-express4');
const sass = require('node-sass-middleware');
const db = require('./lib/db');

var index = require('./routes/index');
var admin = require('./routes/admin');
var worker = require('./routes/worker');
var requester = require('./routes/requester');

var app = express();

// view engine setup
app.engine('mustache', mustache);
app.set('view engine', 'mustache');
app.set('views', path.join(__dirname, 'views'));
app.set('partials', app.get('views'));

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(sass({
  src: path.join(__dirname, 'scss'),
  dest: path.join(__dirname, 'public'),
  debug: true,
  response: true,
  prefix: '/css'
}));

app.use(session({
  store: new sessionPgStrategy({ pgPromise: db.db }),
  resave: false,
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET,
  unset: 'destroy',
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1 * 24 * 60 * 60 * 1000 // 1 day
  }
}));

app.use('/admin', admin);
app.use('/worker', worker);
app.use('/requester', requester);
app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
