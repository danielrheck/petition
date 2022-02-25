const { requireLoggedOutUser } = require("./../routes_middlewares");
const { dataValidation, hash, addUsername } = require("./../database/db");

const express = require("express");
const router = express.Router();

router.get("/register", (req, res) => {
    // CLEAN COOKIES
    req.session = null;
    // RENDER REGISTER PAGE
    return res.render("main", { layout: "register" });
});

router.post("/register", requireLoggedOutUser, (req, res) => {
    let { firstname, lastname, email, password } = req.body;
    // CHECK IF ALL FIELDS WERE SENT
    if (dataValidation(firstname, lastname, email, password)) {
        // IF SO, HASH THE PASSWORD
        hash(password)
            .then((hashedPassword) => {
                // THEN ADD USER TO USERS DB
                addUsername(firstname, lastname, email, hashedPassword)
                    // THE REDIRECT TO PROFILE PAGE
                    .then(({ rows }) => {
                        let user_id = rows[0].id;
                        req.session.id = user_id;
                        return res.redirect("/profile");
                    })
                    // IF ERROR ADDING TO DB, RE-RENDER THE REGISTER FORM WITH A FAULTY DATA MESSAGE
                    .catch(() => {
                        return res.render("main", {
                            layout: "register",
                            checkData: true,
                        });
                    });
            })
            // IF ERROR HASHING, RE-RENDER THE REGISTER FORM WITH A FAULTY DATA MESSAGE
            .catch(() => {
                return res.render("main", {
                    layout: "register",
                    checkData: true,
                });
            });
    } else {
        // IF DATA INVALID, RE-RENDER THE REGISTER FORM WITH A FAULTY DATA MESSAGE
        res.render("main", {
            layout: "register",
            checkData: true,
        });
    }
});

module.exports = router;
