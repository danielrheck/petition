DROP TABLE IF EXISTS signatures;
CREATE TABLE signatures (
    id SERIAL primary key,
    firstname VARCHAR,
    lastname VARCHAR,
    signature VARCHAR
);
