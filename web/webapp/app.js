var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mustache = require('mustache-express4');

var login = require('./routes/login');
var signup = require('./routes/signup');
var worker = require('./routes/worker');
var requester = require('./routes/requester');

var app = express();

// view engine setup
app.engine('mustache', mustache);
app.set('view engine', 'mustache');
app.set('views', path.join(__dirname, 'views'));
app.set('partials', app.get('views'));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/login', login);
app.use('/signup', signup);
app.use('/worker', worker);
app.use('/requester', requester);

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
