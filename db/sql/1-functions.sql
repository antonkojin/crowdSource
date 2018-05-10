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
  UPDATE task SET result = majorityChoice WHERE id = task_id; -- update task result
  UPDATE worker_campaign SET score = score + 1 -- update worker score
  FROM worker_choice LEFT JOIN choice ON choice.id = worker_choice.choice
  LEFT JOIN task ON task.id = choice.task
  WHERE worker_choice.choice = majorityChoice
  AND worker_campaign.campaign = task.campaign
  ;
  RETURN NULL;
EXCEPTION WHEN too_many_rows THEN
  UPDATE task SET result = 0 WHERE id = task_id;
  RETURN NULL;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER complete_task
AFTER INSERT ON worker_choice
FOR EACH ROW
EXECUTE PROCEDURE complete_task();