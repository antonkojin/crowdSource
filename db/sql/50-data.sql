INSERT INTO "user" (email, password, type) VALUES
('requester@mail.test', 'a', 'worker'), -- id 1
('worker@mail.test', 'a', 'requester'); -- id 2

INSERT INTO campaign (name, majority_threshold, workers_per_task, "start", "end", apply_end, requester) VALUES
(
    'test_campaign',
    '1',
    '1',
    '2018-10-10 12:00',
    '2018-10-30 24:00',
    '2018-10-09 24:00',
    1    
); -- id 1

INSERT INTO task (name, context, campaign) VALUES
(
    'task test',
    'select the correct answer',
    1
); -- id 1

INSERT INTO choice (name, value, task) VALUES
('positive', 1, 1),
('neutral', 0, 1),
('negative', -1, 1);

INSERT INTO keyword (description) VALUES
('music'), -- id 1
('games'), -- id 2
('sentiment analisys'); -- id 3

INSERT INTO task_keyword (task, keyword) VALUES
(1, 3);

INSERT INTO worker_attitude (worker, keyword, level) VALUES
(2, 3, 1),
(2, 1, 1),
(2, 2, 1);