-- numero di task validi correttamente eseguiti, cioè task per i quali valgono le seguenti condizioni:
--   - il task è stato eseguito dal lavoratore
--   - il task ha un risultato finale (è stata raggiunta la maggioranza richiesta)
--   - eseguendo il task, la risposta fornita dal lavoratore coincide con il risultato del task,
--     cioè il lavoratore appartiene alla maggioranza che ha determinato il risultato del task.
CREATE FUNCTION end_task(task_id INTEGER) -- triggers on insert in worker_choice when workers_per_task in campaign is reached
RETURNS VOID AS $$
DECLARE
  majority_choice INTEGER;
BEGIN
  WITH votes AS (
    SELECT choice.id AS choice_id,
      COUNT(worker_choice.worker) AS votes
    FROM worker_choice RIGHT JOIN choice
      ON worker_choice.choice = choice.id
    RIGHT JOIN task
      ON task.id = choice.task
    JOIN campaign
      ON campaign.id = task.campaign
    WHERE task.id = task_id -- task_id
    GROUP BY (campaign.id, task.id, choice.id)
    HAVING COUNT(worker_choice.worker) >= campaign.majority_threshold
  ) SELECT v1.choice_id INTO STRICT majority_choice FROM votes AS v1 WHERE v1.votes = (
    SELECT MAX(v2.votes) FROM votes AS v2
  );
  UPDATE task SET result = majority_choice WHERE id = task_id;
EXCEPTION WHEN too_many_rows THEN
  UPDATE task SET result = NULL WHERE id = task_id;
END;
$$ LANGUAGE 'plpgsql';