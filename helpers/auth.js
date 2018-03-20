module.exports = {
    requireAuth: function(req, res, next){
        if(req.isAuthenticated()){
            return next();
        }
        req.flash('danger', 'Not authenticated');
        res.redirect('/user/signin');
    }
}