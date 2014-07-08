SELECT
/*IF count */
	count(*) as count
/*END*/
/*IF count == false*/
	i.*, st.name AS status, e.name AS priority, t.name AS tracker, u.user_name as assigned_to_id
/*END*/
FROM
	ib_issues AS i
	INNER JOIN ib_issue_statuses AS st ON i.status_id = st.id
	INNER JOIN ib_enumerations AS e ON i.priority_id = e.id
	INNER JOIN ib_trackers AS t ON i.tracker_id = t.id
/*IF count == false*/
	LEFT JOIN imm_user AS u ON u.user_cd = i.assigned_to_id
/*END*/
WHERE
	i.project_id = /*project_id:number*/''
	/*IF !isBlank(status_id)*/
		AND i.status_id = /*status_id:number*/''
	/*END*/
	/*IF !isBlank(tracker_id)*/
		AND i.tracker_id = /*tracker_id:number*/''
	/*END*/
	/*IF !isBlank(priority_id)*/
		AND i.priority_id = /*priority_id:number*/''
	/*END*/
	/*IF !isBlank(assigned_to_id)*/
		AND i.assigned_to_id = /*assigned_to_id:string*/''
	/*END*/
	/*IF !isBlank(progress)*/
		AND i.progress >= /*progress:number*/''
	/*END*/
	/*IF !isBlank(author_id)*/
		AND i.author_id = /*author_id:string*/''
	/*END*/
	/*IF !isBlank(start_updated_on)*/
		AND i.updated_on >= /*start_updated_on:date*/null
	/*END*/
	/*IF !isBlank(end_updated_on)*/
		AND i.updated_on <= /*end_updated_on:date*/null
	/*END*/
	/*IF !isBlank(start_created_on)*/
		AND i.created_on >= /*start_created_on:date*/null
	/*END*/
	/*IF !isBlank(end_created_on)*/
		AND i.created_on <= /*end_created_on:date*/null
	/*END*/
	/*IF !isBlank(subject)*/
		AND (i.subject LIKE /*subject:string*/ OR i.description LIKE /*subject:string*/)
	/*END*/
/*IF count == false*/
GROUP BY i.id, u.user_name, st.name, e.name, t.name
/*END*/
/*IF count == false*/
ORDER BY
	/*$sortIndex*/'created_on' /*$sortOrder*/
/*END*/