var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcryptjs');
var User = require('../model/user');
var db = require('./database');

module.exports = function(passport){
    passport.use(new LocalStrategy(function(username, password, done){
        // Match Username
        let query = {username: username};
        User.findOne(query, function(err, user){
            if(err) throw err;
            if(!user){
                return done(null, false, {message: 'No user found'})
            }

            // if user
            bcrypt.compare(password, user.password, function(err, isMatch){
                if(err) throw err;
                if(isMatch){
                    return done(null, user)
                } else {
                    return done(null, false, {message: 'Wrong password!'})
                }
            });

           
        })
    }));

    passport.serializeUser(function(user, done) {
        done(null, user);
    });
    
    passport.deserializeUser(function(user, done) {
        done(null, user);
    });
}