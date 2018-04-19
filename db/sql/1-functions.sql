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

CREATE FUNCTION get_task_for_worker(worker_id INTEGER, campaign_id INTEGER)
RETURNS VOID
AS $$
DECLARE
  -- EMPTY
BEGIN
  
END
$$ LANGUAGE 'plpgsql';