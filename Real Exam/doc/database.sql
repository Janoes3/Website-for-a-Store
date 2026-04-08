CREATE TABLE tbl_Producer(
    ProducerID SERIAL PRIMARY KEY,
    ProducerName VARCHAR(80) NOT NULL,
    ProducerDescription TEXT,
    FarmingMethods TEXT,
    ContactEmail VARCHAR(100),
    ContactPhone VARCHAR(20),
    Address VARCHAR(150)
);


ALTER TABLE tbl_producer
ADD COLUMN passwordhash TEXT;


INSERT INTO tbl_producer (producername, contactemail, passwordhash)
VALUES ('Sam’s Orchard', 'sam@orchard.com', 'cGFzc3dvcmQ=');