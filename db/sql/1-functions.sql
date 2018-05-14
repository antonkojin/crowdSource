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
  FROM worker_choice LEFT JOIN choice ON choice.id = worker_choice.choice
  LEFT JOIN task ON task.id = choice.task
  WHERE worker_choice.choice = majorityChoice
  AND worker_campaign.campaign = task.campaign;

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
    -- TODO: maybe if level is 0 remove the keyword, it's more coherent
    UPDATE worker_attitude SET level = GREATEST(level - 1, 1)
    WHERE worker = worker_keyword.worker
    AND keyword = worker_keyword.keyword;
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