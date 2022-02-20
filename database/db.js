const spicedPg = require("spiced-pg");

const db = spicedPg("postgres:postgres:postgres@localhost:5432/signatures");

module.exports.dataValidation = function (firstname, lastname, signature) {
    if (!firstname || !lastname || !signature) {
        return false;
    } else {
        return true;
    }
};

module.exports.getAllSignatures = function () {
    return db.query(`SELECT firstname, lastname FROM signatures`);
};

module.exports.addSignature = function (firstname, lastname, signature) {
    return db.query(
        `
    INSERT INTO signatures(firstname, lastname, signature)
    VALUES($1, $2, $3)
    RETURNING id
    `,
        [firstname, lastname, signature]
    );
};

module.exports.getSignatureById = function (id) {
    return db.query(`SELECT signature FROM signatures WHERE id = $1`, [id]);
};

// var getAllSignatures = function () {
//     return db.query(
//         `SELECT firstname, lastname, signature, id FROM signatures`
//     );
// };

// getAllSignatures()
//     .then(({ rows }) => {
//         return rows;
//     })
//     .catch((err) => {
//         console.log(err);
//     });

// var getSignatureById = function (id) {
//     return db
//         .query(`SELECT signature FROM signatures WHERE id = $1`, [id])
//         .then(({ rows }) => {
//             return console.log(rows);
//         })
//         .catch((e) => {
//             return console.log("error getting signature from DB: ", e);
//         });
// };

// var addSignature = function (firstname, lastname, signature) {
//     return db.query(
//         `
//     INSERT INTO signatures(firstname, lastname, signature)
//     VALUES($1, $2, $3)
//     RETURNING id
//     `,
//         [firstname, lastname, signature]
//     );
// };

// addSignature("daniel", "heck", "hakdjdhajdh111111").then(({ rows }) => {
//     console.log(rows[0].signature);
// });

// var getSignatureById = function (id) {
//     db.query(`SELECT signature FROM signatures WHERE id = $1`, [id])
//         .then(({ rows }) => {
//             console.log(rows[0].signature);
//             var sig = rows[0].signature;
//         })
//         .catch((e) => {
//             console.log("Error:  ", e);
//         });
// };

// getSignatureById(57);
// function() {
//     console.log()
// }
