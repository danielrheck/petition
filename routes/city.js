const {
    requireLoggedUser,
    requireSignedUser,
} = require("./../routes_middlewares");
const { getSignaturesByCity } = require("./../database/db");

const express = require("express");
const router = express.Router();

router.get(
    "/signed/:city",
    requireLoggedUser,
    requireSignedUser,
    (req, res) => {
        getSignaturesByCity(req.params.city).then(({ rows }) => {
            let allSigners = rows;
            return res.render("main", {
                layout: "city",
                allSigners: allSigners,
                city: req.params.city,
            });
        });
    }
);

module.exports = router;
