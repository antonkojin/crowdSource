INSERT INTO "user" (email, password, type) VALUES
('requester@mail.test', 'a', 'worker'), -- id=1
('worker@mail.test', 'a', 'requester'); -- id=2

INSERT INTO campaign (name, majority_threshold, workers_per_task, "start", "end", apply_end, requester) VALUES
(
    'test_campaign',
    '1',
    '1',
    '2018-10-10 12:00',
    '2018-10-30 24:00',
    '2018-10-09 24:00',
    1    
); -- id=1