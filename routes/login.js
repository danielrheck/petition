const express = require("express");
const router = express.Router();
const {
    getPasswordAndIdByEmail,
    checkSignature,
    compare,
} = require("./../database/db");
const { requireLoggedOutUser } = require("./../routes_middlewares");

router.post("/login", requireLoggedOutUser, (req, res) => {
    // GET THE HASHED PASSWORD AND ID BY EMAIL
    getPasswordAndIdByEmail(req.body.email)
        .then(({ rows }) => {
            // IF EMAIL REGISTERED, SET ID TO THE ONE RETURNED FROM THE QUERY
            if (rows[0]) {
                let id = rows[0].id;
                // COMPARE HASH WITH PROVIDED PASSWORD
                compare(req.body.password, rows[0].password)
                    .then((check) => {
                        // IF PASSWORD IS CORRECT, SET COOKIE WITH THE ID
                        if (check) {
                            req.session.id = id;
                            // CHECK USER SIGNED
                            checkSignature(id).then(({ rows }) => {
                                // IF SO, SET SIGNED COOKIE TO TRUE
                                if (rows[0]) {
                                    req.session.signed = true;
                                }
                                // REDIRECT TO '/'
                                res.redirect("/");
                            });
                        }
                        // IF PASSWORD IS INCORRECT, RENDER THE LOGIN PAGE AGAIN WITH A MESSAGE TO CHECK THE DATA
                        else {
                            return res.render("main", {
                                layout: "login",
                                checkData: true,
                            });
                        }
                    })
                    // IF ERROR COMPARING HASH, RENDER THE LOGIN PAGE AGAIN WITH A MESSAGE TO CHECK THE DATA
                    .catch(() => {
                        return res.render("main", {
                            layout: "login",
                            checkData: true,
                        });
                    });
            }
            // IF E-MAIL NOT FOUND, RENDER THE LOGIN PAGE AGAIN WITH A MESSAGE TO CHECK THE DATA
            else {
                return res.render("main", {
                    layout: "login",
                    checkData: true,
                });
            }
        })
        // IF ERROR QUERYING FROM DB, RENDER THE LOGIN PAGE AGAIN WITH A MESSAGE TO CHECK THE DATA (?)
        .catch(() => {
            return res.render("main", {
                layout: "login",
                checkData: true,
            });
        });
});

router.get("/login", requireLoggedOutUser, (req, res) => {
    return res.render("main", { layout: "login" });
});

module.exports = router;
