SELECT
	i.*, st.name AS status, e.name AS priority, t.name AS tracker, u.user_name
FROM
	ib_issues AS i
	INNER JOIN ib_issue_statuses AS st ON i.status_id = st.id
	INNER JOIN ib_enumerations AS e ON i.priority_id = e.id
	INNER JOIN ib_trackers AS t ON i.tracker_id = t.id
	INNER JOIN imm_user AS u ON u.user_cd = i.author_id
WHERE
	i.id = /*issue_id:number*/''