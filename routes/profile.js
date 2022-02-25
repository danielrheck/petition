const { requireLoggedUser } = require("./../routes_middlewares");
const { addUserProfile, checkProfile } = require("./../database/db");

const express = require("express");
const router = express.Router();

router.get("/profile", requireLoggedUser, (req, res) => {
    checkProfile(req.session.id).then(({ rows }) => {
        // IF WAS SENT, REDIRECT TO '/'
        if (rows[0]) {
            return res.redirect("/");
        }
        // IF USER DIDN'T SEND IT, PRESENT THE PROFILE FORM
        else {
            return res.render("main", { layout: "profile" });
        }
    });
});

router.post("/profile", requireLoggedUser, (req, res) => {
    let { age, city, url } = req.body;
    // IF ALL FIELDS ARE LEFT BLANK, REDIRECT TO '/PETITION'
    if (!age && !city && !url) {
        res.redirect("/petition");
    }
    // IF THERE IS SOMETHING IN THE FORM RESPONSE
    else {
        // CHECK IF URL STARTS WITH 'HTTPS' OR 'HTTP'
        if (url.startsWith("http://") || url.startsWith("https://")) {
            // IF STARTS, ADD IT TO THE DB
            console.log("Adding User Profile:  ", req.session.id);
            addUserProfile(req.session.id, age, city, url)
                // IF ADDED SUCCESSFULLY, REDIRECT TO '/THANKYOU'
                .then(() => {
                    return res.redirect("/petition");
                })
                // IF ERROR, RE-RENDER THE FORM WITH A MESSAGE OF ERROR
                .catch(() => {
                    return res.render("main", {
                        layout: "profile",
                        oops: true,
                    });
                });
        } else {
            // IF URL DOESNT START WITH 'HTTPS' OR 'HTTP', ADD TO THE DATABASE WITH AN EMPTY URL REPLACING IT
            addUserProfile(req.session.id, age, city, "").then(() => {
                console.log("Adding User Profile:  ", req.session.id);
                return res.redirect("/thankyou");
            });
        }
    }
});

module.exports = router;
