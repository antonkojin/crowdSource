-- numero di task validi correttamente eseguiti, cioè task per i quali valgono le seguenti condizioni:
--   - il task è stato eseguito dal lavoratore
--   - il task ha un risultato finale (è stata raggiunta la maggioranza richiesta)
--   - eseguendo il task, la risposta fornita dal lavoratore coincide con il risultato del task,
--     cioè il lavoratore appartiene alla maggioranza che ha determinato il risultato del task.
CREATE FUNCTION complete_task() -- triggers on insert in worker_choice when workers_per_task in campaign is reached
RETURNS TRIGGER AS $$
DECLARE
  task_id INTEGER;
  workers_per_task INTEGER;
  isCompleted BOOLEAN;
  majorityChoice INTEGER;
  worker_keyword RECORD;
BEGIN
  task_id := (SELECT task FROM choice WHERE id = NEW.choice);
  workers_per_task := (SELECT campaign.workers_per_task FROM task JOIN campaign ON task.campaign = campaign.id WHERE task.id = task_id);
  isCompleted := (
    SELECT COUNT(*) >= workers_per_task
    FROM worker_choice JOIN choice
    ON worker_choice.choice = choice.id
    WHERE choice.task = task_id
  );
  -- only one MAX(COUNT(workers for each choice of task))
  IF NOT isCompleted THEN RETURN NULL; END IF;

  WITH votes AS (
    SELECT choice.id AS choice_id, COUNT(worker_choice.worker) AS votes FROM
    worker_choice JOIN choice ON choice.id = worker_choice.choice
    WHERE choice.task = task_id
    GROUP BY choice.id
  ) SELECT votes.choice_id
    INTO STRICT majorityChoice
    FROM votes
    WHERE votes.votes = (
      SELECT MAX(v2.votes) FROM votes AS v2
    );
  -- if there is majority
  UPDATE task SET result = majorityChoice WHERE id = task_id; -- update task result

  UPDATE worker_campaign SET score = score + 1 -- update worker score
  FROM worker_choice JOIN choice ON choice.id = worker_choice.choice
  JOIN task ON task.id = choice.task
  WHERE worker_choice.choice = majorityChoice
  AND worker_campaign.campaign = task.campaign
  AND worker_campaign.worker = worker_choice.worker;

  FOR worker_keyword IN ( -- workers to level up
    SELECT wc.worker, tk.keyword
    FROM worker_choice AS wc
    JOIN choice AS c ON c.id = wc.choice
    JOIN task_keyword AS tk ON tk.task = c.task
    WHERE wc.choice = majorityChoice
    AND c.task = task_id
    GROUP BY (wc.worker, tk.keyword)
  ) LOOP
    IF EXISTS (
      SELECT keyword
      FROM worker_attitude AS wa
      WHERE wa.worker = worker_keyword.worker
      AND wa.keyword = worker_keyword.keyword
    ) THEN
      UPDATE worker_attitude SET level = level + 1
      WHERE worker = worker_keyword.worker
      AND keyword = worker_keyword.keyword;
    ELSE
      INSERT INTO worker_attitude(worker, keyword)
      VALUES (worker_keyword.worker, worker_keyword.keyword);
    END IF;
  END LOOP;

  FOR worker_keyword IN ( -- workers to level down
    SELECT wc.worker, tk.keyword
    FROM worker_choice AS wc
    JOIN choice AS c ON c.id = wc.choice
    JOIN task_keyword AS tk ON tk.task = c.task
    WHERE wc.choice != majorityChoice
    AND c.task = task_id
    GROUP BY (wc.worker, tk.keyword)
  ) LOOP
    UPDATE worker_attitude SET level = GREATEST(level - 1, 0)
    WHERE worker = worker_keyword.worker
    AND keyword = worker_keyword.keyword;
    DELETE FROM worker_attitude WHERE level = 0;
  END LOOP;
  RETURN NULL;
EXCEPTION WHEN too_many_rows THEN -- if there is no majority
  UPDATE task SET result = 0 WHERE id = task_id;
  RETURN NULL;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER complete_task
AFTER INSERT ON worker_choice
FOR EACH ROW
EXECUTE PROCEDURE complete_task();




CREATE FUNCTION assign_task(worker_id INTEGER, campaign_id INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        WITH done_tasks AS (
            SELECT choice.task FROM
            worker_choice JOIN choice
              ON worker_choice.choice = choice.id
            JOIN task
              ON choice.task = task.id
            WHERE worker_choice.worker = worker_id
              AND task.campaign = campaign_id
        ), tasks_keywords AS (
            -- only if  workerker applied to the campaign
            SELECT task.id AS task, task_keyword.keyword FROM
            task JOIN task_keyword
              ON task.id = task_keyword.task
            JOIN campaign
              ON campaign.id = task.campaign
            JOIN worker_campaign
              ON worker_campaign.campaign = campaign_id
            WHERE task.campaign = campaign_id
              AND worker_campaign.worker = worker_id
              AND campaign.workers_per_task >= (
                SELECT COUNT(worker) FROM worker_choice JOIN choice ON worker_choice.choice = choice.id WHERE choice.task = task.id
              )
            AND task.id NOT IN (SELECT * FROM done_tasks)
        ), worker_keywords AS (
            SELECT w.keyword, w.level FROM
            worker_attitude AS w
            WHERE w.worker = worker_id
        ), task_keyword_levels AS (
            SELECT task, t.keyword, level FROM
            tasks_keywords AS t LEFT JOIN worker_keywords AS w
            ON t.keyword = w.keyword
            ORDER BY level
        ), tasks_keywords_statistics AS (
            SELECT task, count(level), SUM(level), MAX(level), MIN(level)
            FROM task_keyword_levels
            GROUP BY task
        ) SELECT task
            FROM tasks_keywords_statistics
            ORDER BY sum DESC LIMIT 1
    );
END;
$$ LANGUAGE 'plpgsql';
