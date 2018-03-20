module.exports = {
    requireAuth: function(req, res, next){
        if(req.isAuthenticated()){
            return next();
        }
        res.redirect('/user/signin');
        req.flash('danger', 'Not authenticated');
    }
}