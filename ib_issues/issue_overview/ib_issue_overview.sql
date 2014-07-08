SELECT 
	t.id, t.name,COALESCE(it.no_trackers,0) AS n_tracker,COALESCE(it1.no_open_trackers,0) AS n_open_tracker 
FROM 
	ib_trackers t 
	INNER JOIN ib_projects_trackers pt ON pt.tracker_id=t.id 
	LEFT OUTER JOIN (SELECT count(*) as no_trackers, i.tracker_id FROM ib_issues i GROUP BY i.tracker_id) it ON it.tracker_id=pt.tracker_id
	LEFT OUTER JOIN (SELECT count(*) as no_open_trackers, i1.tracker_id FROM ib_issues i1 WHERE i1.status_id!='5' GROUP BY i1.tracker_id) it1 ON it1.tracker_id=pt.tracker_id
WHERE 
	pt.project_id= /*project_id:number*/'' 
ORDER BY 
	t.position ASC