-- Check if the item exists in checklistitems table
SELECT * FROM checklistitems WHERE id = '1c1678d4-2788-405f-8900-81c2c1adb301';

-- Check if the item exists in userchecklistitems table (if this is being used)
SELECT * FROM userchecklistitems WHERE id = '1c1678d4-2788-405f-8900-81c2c1adb301';

-- List all items from checklistitems to see if the ID format is different
SELECT id FROM checklistitems LIMIT 10; 