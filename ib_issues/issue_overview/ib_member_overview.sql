SELECT
	id, name, array_to_string(ARRAY(SELECT u.user_name FROM ib_projects_users_roles pr
	INNER JOIN imm_user AS u ON u.user_cd = pr.user_cd
	WHERE pr.project_id = /*project_id:number*/'' AND  pr.role_id = r.id
	GROUP BY pr.user_cd, u.user_name ), ', ') AS user_name
FROM 
	ib_roles r
ORDER BY
	r.position