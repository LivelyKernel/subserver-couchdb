module.exports = function(basepath, app) {
    app.get(basepath, function(req, res) {
        res.send({name: 'CouchDB subserver'})
    })
}
