SELECT
/*IF count */
	count(*) as count
/*END*/
/*IF count == false*/
	te.*, i.subject, p.name AS project_name, t.name AS tracker, e.name AS activity, u.user_name
/*END*/
FROM
	ib_time_entries AS te
	INNER JOIN ib_issues AS i ON i.id = te.issue_id
	INNER JOIN ib_projects AS p ON i.project_id = p.id
	INNER JOIN ib_trackers AS t ON i.tracker_id = t.id
	INNER JOIN ib_enumerations AS e ON te.activity_id = e.id
/*IF count == false*/
	LEFT JOIN imm_user AS u ON u.user_cd = te.user_cd
/*END*/
WHERE
	issue_id = /*issue_id:number*/''	
/*IF count == false*/
GROUP BY te.id,i.id, u.user_name, p.name, e.name, t.name
/*END*/
/*IF count == false*/
ORDER BY
	/*$sortIndex*/'created_on' /*$sortOrder*/
/*END*/