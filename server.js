var express = require('express');
var app = express();

// body parser to parse post body to JSON
var bodyParser = require('body-parser');
app.use(bodyParser.json());

// log events
var logger = require('nlogger').logger(module);

// authentication module
var passport = require('passport');
var passportLocal = require('passport-local');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');

app.use(cookieParser());
app.use(expressSession({
  secret : 'mySecretKey',
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

/* register a serializeUser function, which tells passport which unique
 information from the user object it should use to create the cookie */
passport.serializeUser(function(user, done){
  logger.debug('serializing: ', user.id);
  done(null, user.id);
});

passport.deserializeUser(function(id, done){
  // query database to fetch the user based on id
  logger.debug('de-serializing: ', id);
  UserModel.findOne({id: id}, function(err, doc){
    done(null, doc);
  });
});

passport.use(new passportLocal.Strategy(function (username, password, done) {
  logger.info("username: ", username, "password", password);
  
  UserModel.findOne({id : username}, function(err, user){
      logger.debug(err, user);
      if(err) return done(err, null);
      if(!user) return done(null,null, "user not found");
      if(user.password == password) { //authentication successful
        done(null, user);
      } else { // authentication failed
        done(null, null, 'password not matched');
      } 
  });  
}));

var mongoose = require('mongoose');

var db = mongoose.createConnection('mongodb://localhost/userDB');

var userSchema = mongoose.Schema(
    {
      id : String,
      name: String,
      password: String,
      city: String,
      profession: String
    });
//a connection or a pipe to the db
var UserModel = db.model('User', userSchema);

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log("Connected to userDB");
  // start the node server when the db is ready
  app.listen(8080, function() {
    console.log('Server started');
  });
});

// Route implementations
// get all users, supports login operation
app.post('/api/login/', function login (req,res) {
  logger.info("attempting to authenticate user", req.body);

  passport.authenticate('local', function(err, user, info) {
        logger.info("in local auth"); 
        if (err)
          return res.status(500).end(); 
        if (!user)
          return res.status(404).send(info);

          return res.send({done: 'done'});
        /* user is authenticated at this point but a cookie is not created, 
           use the login method in the request object to serialize the user 
           and create the cookie */
        /*req.logIn(user, function(err) { 
          if (err) { 
            return res.status(500).end();
          }
          var emberuser = makeEmberUser(user);
          logger.debug(emberuser);
          return res.send({users : [emberuser]});
        });*/
      })(req, res);
  

  
});







