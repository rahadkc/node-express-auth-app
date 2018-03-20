var express = require('express');
var multer = require('multer');
var path = require('path');
var passport = require('passport');
var bcrypt = require('bcryptjs');
var { requireAuth } = require('./helpers/auth');
var ArticleModel = require('./model/article');
var NewUser = require('./model/user');


const storage = multer.diskStorage({
    destination: './public/uploads',
    filename: function(req, file, callback){
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init upload
// const upload = multer({
//     storage: storage,
//     limits: {fileSize: 1000000},
//     fileFilter: function(req, file, callback){
//         checkFileType(file, callback);
//     }
// }).array('myImage', 5);

const singleUpload = multer({
    storage: storage,
    limits: {fileSize: 1000000},
    fileFilter: function(req, file, callback){
        checkFileType(file, callback);
    }
}).single('myImage');

function checkFileType(file, callback){
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if(mimetype && extname){
        return callback(null, true);
    } else {
        console.log(mimetype , extname);
        callback('Error: Filetype not valid!')
    }
}


module.exports = function(app) {

    // user
    //signin routes
    app
    .get('/user/signin', function(req, res){
        res.render('signin', {
            title: 'Sign in'
        })
    })
    .post('/user/signin', function(req, res, next){
        passport.authenticate('local', { 
            successRedirect: '/',
            failureRedirect: '/user/signin',
            failureFlash: true })(req, res, next);
    })

    // registration routes
    app
    .get('/user/register', function(req, res){
        res.render('register', {
            title: 'register'
        });
    })
    .post('/user/register', function(req, res){
        var name = req.body.name;
        var email = req.body.email;
        var username = req.body.username;
        var password = req.body.password;
        var password2 = req.body.password2;

        req.checkBody('name', 'Name is required').notEmpty();
        req.checkBody('email', 'email is required').isEmail();
        req.checkBody('username', 'username is required').notEmpty();
        req.checkBody('password', 'password is required').notEmpty();
        req.checkBody('password2', 'password do not match').equals(req.body.password);

        var errors = req.validationErrors();

        if(errors) {
            res.render('register', {
                errors: errors
            })
        } else {
            var newUser = new NewUser();
            newUser.name = name; 
            newUser.email = email; 
            newUser.username = username; 
            newUser.password = password; 
            bcrypt.genSalt(10, function(err, salt){
                bcrypt.hash(newUser.password, salt, function(err, hash){
                    if(err){
                        console.log(err);
                    }
                    newUser.password = hash;
                    newUser.save(function(err){
                        if(err) {
                            res.render('register', {msg: "Sorry data saving error"});
                            return;
                        };
                        req.flash('success', 'You are now registered and can log in');
                        res.redirect('/user/signin');
                    })

                })
            });
        }
    });
    app.get('/', requireAuth, function(req, res) {
        ArticleModel.find({author: req.user._id}, function(err, articles){
            if(err) res.send('Find query error');
            res.render('index', {
                title: 'Title is here',
                articles: articles
            });
        });
    });
    
    app.get('/article/:id', requireAuth, function(req, res) {
        ArticleModel.findById(req.params.id, function(err, article){
            if(err) res.send('No article find');
            
            if(article.author !== req.user._id){
                res.render('article', {
                    unauthorized: true
                })
            } else {
                NewUser.findById(article.author, function(err, user) {
                    res.render('article', {
                        article: article, 
                        author: user.name
                    }); 
                })
            }
            
        });
    });
    
    // edit form route
    app.get('/article/edit/:id', requireAuth, function(req, res) {
        var _id = req.params.id;
        ArticleModel.findById(req.params.id, function(err, article){
            if(err) res.send('No article find');
            console.log(article);
            if(article.author !== req.user._id){
               res.redirect('/')
            } else {
                res.render('edit', {
                    article: article
                });
            }
        });
    });
    

    
    // edit
    app.post('/article/edit/:id', singleUpload, function(req, res) {
        var article = {};
        article.title = req.body.title;
        article.author = req.body.author;
        article.body = req.body.body;
        article.file = (typeof req.file !== 'undefined')  ? req.file.filename : 'No file selected';
        
        var query = {_id: req.params.id}; 
        
        ArticleModel.findOneAndUpdate(query, article, function(err){
            if(err) res.send('Error updating article');
            req.flash('success', 'Article updated');
            res.redirect('/');
        }) 
    });
    
    // delete
    app.get('/article/delete/:id', requireAuth, function(req, res) {
        var query = {_id: req.params.id};
        var author = { author: req.user._id };
        if(!author){
            res.status(500).send();
        }
        ArticleModel.findById(req.params.id, function(err, article) {
            if(article.author !== req.user._id){
                req.flash('danger', 'You are not authorized');
                res.redirect('/');
            } else {
                console.log('here removing id');
                article.remove(query, function(err){
                    if(err){
                        console.log(err);
                    }
                    req.flash('success', 'One Article deleted successfully');
                    res.redirect('/');
                });
                
            }
        })

        // ArticleModel.findOneAndRemove(query, function(err){
        //     if(err) res.send('Error deleting article');
        //     req.flash('success', 'One Article deleted successfully');
        //     res.redirect('/');
        // }) 
    });
    
    app.get('/article/add/new', requireAuth, function(req, res) {
        res.render('add', {
            title: 'Add article'
        })
    });

    // app.get('/newarticle',  function(req, res) {
    //         console.log(req.body, 'from get');
    //         res.render('newadd', {
    //             title: 'File'
    //         })
    //     })
    //     .post('/newarticle', singleUpload, function(req, res) {
    //     console.log(req.body, 'from post', req.file);

    //     res.render('newadd', {
    //         title: 'File',
    //         successMsg: 'File uploaded!',
    //         name: req.body.title,
    //         about: req.body.body,
    //         file: req.file
    //     })
    // });
    
    app.post('/article/add/new', singleUpload,  function(req, res) {
        req.checkBody('title', 'Title is required').notEmpty();
        req.checkBody('body', 'Body is required').notEmpty();
        // req.checkBody('file', 'Image is required').notEmpty();
        // console.log(req.body, 'from top', req);
        var errors = req.validationErrors();
        console.log(errors, 'errors', req.file);
    
        if(errors){
            res.render('add', {
                title:'Add article',
                errors: errors
            });
        } else {
            let article = new ArticleModel();
            article.title = req.body.title;
            article.author = req.user._id;
            article.body = req.body.body;
            article.file = req.file.filename;
            article.save(function(err){
                if(err) res.send('Error saving data');
                req.flash('success', 'Article added successfully');
                res.redirect('/');
            });
        }
    });

    app.get('/signout', requireAuth, function(req, res){
        req.logout();
        req.flash('success', 'You are logged out!');
        res.redirect('/user/signin');
    })

    // app.all('*', function(req, res){
    //     res.redirect('/user/signin');
    // })
}