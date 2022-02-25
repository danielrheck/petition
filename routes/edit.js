const { requireLoggedUser } = require("./../routes_middlewares");
const {
    hash,
    updateUserWithPassword,
    updateUsersWithoutPassword,
    updateProfile,
    getUserData,
} = require("./../database/db");

const express = require("express");
const router = express.Router();

router.get("/edit", requireLoggedUser, (req, res) => {
    getUserData(req.session.id)
        .then(({ rows }) => {
            let data = rows[0];
            return res.render("main", { layout: "edit", data: data });
        })
        .catch((e) => {
            console.log("Error retrieving user data from DB: ", e);
            return res.redirect("/");
        });
});

router.post("/edit", requireLoggedUser, (req, res) => {
    // IF NO PASSWORD
    if (req.body.password == "") {
        // CHANGE  ALL BUT SIGNATURE
        updateUsersWithoutPassword(
            req.session.id,
            req.body.firstname,
            req.body.lastname,
            req.body.email
        )
            .then(() => {
                if (
                    !req.body.url.startsWith("http://") &&
                    !req.body.url.startsWith("https://")
                ) {
                    req.body.url = "";
                }
                // CHANGE OTHER FIELDS AND REDIRECT
                updateProfile(
                    req.session.id,
                    req.body.age,
                    req.body.city,
                    req.body.url
                )
                    .then(() => {
                        console.log("USER UPDATED WITH NO PW");
                        res.redirect("/");
                    })
                    .catch((e) => {
                        console.log("Error updating user: ", e);
                        res.redirect("/");
                    });
            })
            .catch((e) => {
                console.log("Error updating user: ", e);
                res.redirect("/");
            });
    } else {
        // HASH PASSWORD AND SAVE ALL FIELDS
        hash(req.body.password)
            .then((hashedPassword) => {
                updateUserWithPassword(
                    req.session.id,
                    req.body.firstname,
                    req.body.lastname,
                    req.body.email,
                    hashedPassword
                )
                    .then(() => {
                        if (
                            !req.body.url.startsWith("http://") &&
                            !req.body.url.startsWith("https://")
                        ) {
                            req.body.url = "";
                        }
                        updateProfile(
                            req.session.id,
                            req.body.age,
                            req.body.city,
                            req.body.url
                        )
                            .then(() => {
                                console.log("USER UPDATED WITH PW");
                                return res.redirect("/");
                            })
                            .catch((e) => {
                                console.log("Error updating profile: ", e);
                                return res.redirect("/");
                            });
                    })
                    .catch((e) => {
                        console.log(
                            "Error updating user with password change: ",
                            e
                        );
                        return res.redirect("/");
                    });
            })
            .catch((e) => {
                console.log("Error hashing PW: ", e);
                return res.redirect("/");
            });
    }
});

module.exports = router;
