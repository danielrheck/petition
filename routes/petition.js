const {
    requireLoggedUser,
    requireUnsignedUser,
} = require("./../routes_middlewares");
const { addSignature } = require("./../database/db");

const express = require("express");
const router = express.Router();

router.get("/petition", requireLoggedUser, requireUnsignedUser, (req, res) => {
    return res.render("main", { layout: "petition" });
});

router.post("/petition", requireLoggedUser, requireUnsignedUser, (req, res) => {
    if (req.body.Signature == "") {
        // IF SIGNATURE IS EMPTY, SEND THE FORM BACK WITH MESSAGE ERROR
        return res.render("main", { layout: "petition", invalid: true });
    } else {
        // IF THE USER SIGNED, ADD THE SIGNATURE TO THE SINATURES TABLE
        addSignature(req.session.id, req.body.Signature)
            // IF ADDED SUCCESSFULLY, SET SIGNED COOKIE TO TRUE REDIRECT TO 'THANKYOU'
            .then(() => {
                req.session.signed = true;
                return res.redirect(`/thankyou`);
            })
            // IF NOT, SEND THE PETITION AGAIN WITH AN ERROR MESSAGE
            .catch((e) => {
                console.log("Error inserting in the DB:  ", e);
                return res.redirect("/");
            });
    }
});

module.exports = router;
