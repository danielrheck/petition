const {
    addUserProfile,
    addSignature,
    dataValidation,
    hash,
    addUsername,
    getPasswordAndIdByEmail,
    checkSignature,
    compare,
    updateUserWithPassword,
    updateUsersWithoutPassword,
    updateProfile,
    deleteSignature,
    deleteAccount,
    getSignaturesByCity,
    getAllSignatures,
    getUserData,
} = require("./database/db");

module.exports.postProfile = function (req, res) {
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
};

module.exports.addSign = function (req, res) {
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
};

module.exports.registerUser = function (req, res) {
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
};

module.exports.login = function (req, res) {
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
};

module.exports.editProfile = function (req, res) {
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
};

module.exports.deleteSignatureOrAccount = function (req, res) {
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
};

module.exports.getCity = function (req, res) {
    getSignaturesByCity(req.params.city).then(({ rows }) => {
        let allSigners = rows;
        return res.render("main", {
            layout: "city",
            allSigners: allSigners,
            city: req.params.city,
        });
    });
};

module.exports.getSigns = function (req, res) {
    getAllSignatures().then(({ rows }) => {
        let allSigners = rows;
        return res.render("main", {
            layout: "signed",
            allSigners: allSigners,
        });
    });
};

module.exports.getEdit = function (req, res) {
    getUserData(req.session.id)
        .then(({ rows }) => {
            let data = rows[0];
            return res.render("main", { layout: "edit", data: data });
        })
        .catch((e) => {
            console.log("Error retrieving user data from DB: ", e);
            return res.redirect("/");
        });
};
