CREATE TABLE IF NOT EXISTS sync (
    episode INTEGER NOT NULL,
    frame INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS episodes (
    id INTEGER PRIMARY KEY,
    frames INTEGER BOOLEAN NOT NULL
);

INSERT INTO sync (episode, frame) VALUES (1, 1);

INSERT INTO episodes (id, frames) VALUES (1, 2804);
INSERT INTO episodes (id, frames) VALUES (2, 2804);
INSERT INTO episodes (id, frames) VALUES (3, 2805);
INSERT INTO episodes (id, frames) VALUES (4, 2804);
INSERT INTO episodes (id, frames) VALUES (5, 2805);
INSERT INTO episodes (id, frames) VALUES (6, 2804);
INSERT INTO episodes (id, frames) VALUES (7, 2805);
INSERT INTO episodes (id, frames) VALUES (8, 2804);
INSERT INTO episodes (id, frames) VALUES (9, 2803);
INSERT INTO episodes (id, frames) VALUES (10, 2804);
INSERT INTO episodes (id, frames) VALUES (11, 2805);
INSERT INTO episodes (id, frames) VALUES (12, 2804);
INSERT INTO episodes (id, frames) VALUES (13, 2804);
INSERT INTO episodes (id, frames) VALUES (14, 2804);
INSERT INTO episodes (id, frames) VALUES (15, 2804);
INSERT INTO episodes (id, frames) VALUES (16, 2805);
INSERT INTO episodes (id, frames) VALUES (17, 2805);
INSERT INTO episodes (id, frames) VALUES (18, 2804);
INSERT INTO episodes (id, frames) VALUES (19, 2804);
INSERT INTO episodes (id, frames) VALUES (20, 2805);
INSERT INTO episodes (id, frames) VALUES (21, 2804);
INSERT INTO episodes (id, frames) VALUES (22, 2805);
INSERT INTO episodes (id, frames) VALUES (23, 2804);
INSERT INTO episodes (id, frames) VALUES (24, 2805);
INSERT INTO episodes (id, frames) VALUES (25, 2806);
INSERT INTO episodes (id, frames) VALUES (26, 2776);
