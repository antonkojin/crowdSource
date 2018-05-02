-- CREATE FUNCTION get_character_dices(user_email VARCHAR(254))
-- RETURNS TABLE (
--     id INTEGER,
--     dice_1 SMALLINT
-- ) AS $$
-- DECLARE
--     character_rolls RECORD;
-- BEGIN
--     IF EXISTS (SELECT * FROM characters WHERE "user" = user_email LIMIT 1) THEN RETURN; END IF;
--     IF (SELECT count(*) FROM rolls WHERE rolls."user" = user_email LIMIT 5) != 5 THEN
--         INSERT INTO rolls (dice_1, dice_2, dice_3, "user") VALUES
--             (floor(random() * 6) + 1, floor(random() * 6) + 1, floor(random() * 6) + 1, user_email),
--     END IF;
--     RETURN QUERY SELECT rolls.id, rolls.dice_1, rolls.dice_2, rolls.dice_3
--         FROM rolls WHERE rolls."user" = user_email
--         LIMIT 5;
-- END;
-- $$ LANGUAGE 'plpgsql';



-- numero di task validi correttamente eseguiti, cioè task per i quali valgono le seguenti condizioni:
--   - il task è stato eseguito dal lavoratore
--   - il task ha un risultato finale (è stata raggiunta la maggioranza richiesta)
--   - eseguendo il task, la risposta fornita dal lavoratore coincide con il risultato del task,
--     cioè il lavoratore appartiene alla maggioranza che ha determinato il risultato del task.
CREATE FUNCTION end_task(task_id INTEGER) -- triggers on insert in worker_choice when workers_per_task in campaign is reached
RETURNS INTEGER AS $$
  WITH votes AS (
    SELECT choice.id AS choice_id,
      COUNT(worker_choice.worker) AS votes
    FROM worker_choice RIGHT JOIN choice
      ON worker_choice.choice = choice.id
    RIGHT JOIN task
      ON task.id = choice.task
    JOIN campaign
      ON campaign.id = task.campaign
    WHERE task.id = 1 -- task_id
    GROUP BY (campaign.id, task.id, choice.id)
    HAVING COUNT(worker_choice.worker) >= campaign.majority_threshold
  ) SELECT v1.choice_id
    FROM votes AS v1 WHERE v1.votes = (
      SELECT MAX(v2.votes) FROM votes AS v2
    ); -- if has one and only one row then the task has majority, else not
  SELECT 0;
$$ LANGUAGE 'sql';