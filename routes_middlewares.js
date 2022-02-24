const { getSignatureById } = require("./database/db");

module.exports.requireLoggedOutUser = function (req, res, next) {
    if (req.session.id) {
        return res.redirect("/");
    } else {
        next();
    }
};

module.exports.requireLoggedUser = function (req, res, next) {
    if (!req.session.id) {
        console.log("user not logged in");
        return res.redirect("/login");
    } else {
        next();
    }
};

module.exports.requireSignedUser = function (req, res, next) {
    if (!req.session.id) {
        console.log("user not logged");
        return res.redirect("/login");
    } else {
        console.log("user logged");
        getSignatureById(req.session.id).then(({ rows }) => {
            if (!rows[0]) {
                console.log("User didn't sign");
                return res.redirect("/petition");
            } else {
                console.log("signed user");
                req.session.signed = true;
                next();
            }
        });
    }
};

module.exports.requireUnsignedUser = function (req, res, next) {
    getSignatureById(req.session.id).then(({ rows }) => {
        if (!rows[0]) {
            next();
        } else {
            return res.redirect("/thankyou");
        }
    });
};
