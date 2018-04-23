INSERT INTO requester (email, password) VALUES
('requester@mail.test', 'a');
INSERT INTO worker (email, password) VALUES
('worker@mail.test', 'a');

INSERT INTO campaign (name, majority_threshold, workers_per_task, "start", "end", apply_end, requester) VALUES
(
    'test_campaign_1',
    '1',
    '1',
    '2018-10-10 12:00',
    '2018-10-30 24:00',
    '2018-10-09 24:00',
    1    
),
(
    'test_campaign_2',
    '1',
    '1',
    '2018-10-10 12:00',
    '2018-10-30 24:00',
    '2018-04-01 24:00',
    1    
),
(
    'test_campaign_3',
    '1',
    '1',
    '2018-10-10 12:00',
    '2018-10-30 24:00',
    '2018-10-09 24:00',
    1    
); -- id 1

INSERT INTO task (name, context, campaign) VALUES
(
    'task test 1',
    'select the correct answer',
    1
); -- id 1

INSERT INTO task (name, context, campaign) VALUES
(
    'task test 2',
    'select the correct answer',
    1
); -- id 2

INSERT INTO task (name, context, campaign) VALUES
(
    'task test 3',
    'select the correct answer',
    1
); -- id 3

INSERT INTO choice (name, value, task) VALUES
('positive', 1, 1),
('neutral', 0, 1),
('negative', -1, 1),
('positive', 1, 2),
('neutral', 0, 2),
('negative', -1, 2),
('positive', 1, 3),
('neutral', 0, 3),
('negative', -1, 3);

INSERT INTO keyword (description) VALUES
('music'), -- id 1
('games'), -- id 2
('porn'), -- id 3
('sentiment analisys'); -- id 4

INSERT INTO task_keyword (task, keyword) VALUES
(1, 2), (1, 4),
(2, 4), (2, 1),
(3, 4), (3, 3), (3, 1);

INSERT INTO worker_attitude (worker, keyword, level) VALUES
(1, 1, 1),
(1, 2, 2),
(1, 3, 3),
(1, 4, 4);

INSERT INTO worker_campaign (worker, campaign) VALUES
(1, 1);