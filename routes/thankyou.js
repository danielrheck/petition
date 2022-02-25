const {
    requireLoggedUser,
    requireSignedUser,
} = require("./../routes_middlewares");
const {
    checkSignature,
    deleteSignature,
    deleteAccount,
} = require("./../database/db");

const express = require("express");
const router = express.Router();

router.get("/thankyou", requireLoggedUser, requireSignedUser, (req, res) => {
    checkSignature(req.session.id).then(({ rows }) => {
        let signature = rows[0].signature;
        return res.render("main", {
            layout: "thankyou",
            signature: signature,
        });
    });
});

router.post("/thankyou", requireLoggedUser, (req, res) => {
    if (req.body.deleteSignature) {
        req.session.signed = false;
        deleteSignature(req.session.id)
            .then(() => {
                return res.redirect("/");
            })
            .catch(() => {
                req.session.signed = true;
                return res.redirect("/thankyou");
            });
    } else if (req.body.deleteAccount) {
        let id = req.session.id;
        req.session = null;
        deleteAccount(id);
        return res.redirect("/");
    }
});

module.exports = router;
