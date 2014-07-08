SELECT
	ic.description AS old_description, i.id, i.description AS new_description, 
	t.name AS tracker, u.user_name, ic.updated_on
FROM
	ib_issues_changes AS ic
	INNER JOIN ib_issues AS i ON i.id = ic.issue_id
	INNER JOIN ib_trackers AS t ON i.tracker_id = t.id
	INNER JOIN imm_user AS u ON u.user_cd = ic.updated_by
WHERE
	ic.id = /*diff_id:number*/''