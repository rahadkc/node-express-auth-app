let dbURL;

if (process.env.NODE_ENV) {
    dbURL = 'mongodb://rahadkc:5354diary@ds047911.mlab.com:47911/mydiary';
} else {
    dbURL = 'mongodb://localhost/blog'
}

module.exports = {
    database: dbURL,
    secret: 'Mysecret'
}