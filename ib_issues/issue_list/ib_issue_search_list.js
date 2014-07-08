/** initial page set */
var $page = 1;

var $form = {
	status_id : "",
	tracker_id : "",
	priority_id : "",
	assigned_to_id : "",
	progress : "",
	author_id : "",
	start_updated_on : "",
	end_updated_on : "",
	start_created_on : "",
	end_created_on : "",
	subject : ""
}
var $issueSearchTitle = "";

/** for displaying the trackers */
var $trackerList = '';

/** for displaying the status */
var $statusList = '';

/** for displaying the priority */
var $priorityList = '';

/** for displaying the assign to */
var $assignToList = '';

/** for displaying the author list */
var $authorList = '';

/**
* display progress list
*/
var progressList = [{ label: ">=0%", value: "0" }, { label: ">=10%", value: "10" }, { label: ">=20%", value: "20" }, { label: ">=30%",	value: "30"	},
					{ label: ">=40%", value: "40" }, { label: ">=50%", value: "50" }, { label: ">=60%", value: "60" }, { label: ">=70%",	value: "70"	},
					{ label: ">=80%", value: "80" }, { label: ">=90%", value: "90" }, { label: ">=100%", value: "100" }];

/**
 * 入力チェック定義オブジェクト。
 * @type Object
 */
var validateRule = {
	page   : {caption: 'page', integer:true},
	rowNum : {caption: 'rowNum', integer:true},
	sortIndex : {caption : 'sortIndex', isIn:['id','tracker','status','priority','subject','assigned_to_id','updated_on']},
	sortOrder: {caption : 'sortOrder', isIn:['asc', 'desc']},
	status_id:{caption : MessageManager.getMessage("STATUS.ID")},
	tracker_id:{caption : MessageManager.getMessage("TRACKER.ID")},
	priority_id:{caption : MessageManager.getMessage("PRIORITY.ID")},
	assigned_to_id:{caption : MessageManager.getMessage("ASSIGN.TO.ID")},
	progress:{caption : MessageManager.getMessage("PROGRESS.ID")},
	author_id:{caption : MessageManager.getMessage("AUTHOR.ID")},
	start_updated_on:{caption : MessageManager.getMessage("UPDATED.ON.ID")},
	end_updated_on:{caption : MessageManager.getMessage("UPDATED.ON.ID")},
	start_created_on:{caption : MessageManager.getMessage("CREATED.ON.ID")},
	end_created_on:{caption : MessageManager.getMessage("CREATED.ON.ID")},
	subject:{caption : MessageManager.getMessage("SUBJECT.ID"), maxlength: 255}
};

/**
 * ソートキーに対応するテーブルのフィールド名
 */
var sortIndexes = {
	id : 'id',
	tracker : 't.name',
	status : 'st.name',
	priority : 'e.name',
	subject : 'subject',
	assigned_to_id : 'u.user_name',
	updated_on : 'updated_on'
};

var $issueSearchCondition = {
		page : "",
		rowNum : "",
		status_id : "",
		tracker_id : "",
		priority_id : "",
		assigned_to_id : "",
		progress : "",
		author_id : "",
		start_updated_on : "",
		end_updated_on : "",
		start_created_on : "",
		end_created_on : "",
		subject : "",
		sortIndex : "",
		sortOrder : "",
		backToList : "false"
};
/**
 * initialization function for the page on which the value is displayed
 * 
 * @param {Request} request Request object
 */
function init(request){
	$issueSearchCondition = Client.get("ib_issues/issues/list"+"$issueSearchCondition");
	if ($issueSearchCondition != null && $issueSearchCondition.backToList == "true") {
		$form.status_id = $issueSearchCondition.status_id;
		$form.tracker_id = $issueSearchCondition.tracker_id;
		$form.priority_id = $issueSearchCondition.priority_id;
		$form.assigned_to_id = $issueSearchCondition.assigned_to_id;
		$form.progress = $issueSearchCondition.progress;
		$form.author_id = $issueSearchCondition.author_id;
		$form.start_updated_on = $issueSearchCondition.start_updated_on;
		$form.end_updated_on = $issueSearchCondition.end_updated_on;
		$form.start_created_on = $issueSearchCondition.start_created_on;
		$form.end_created_on = $issueSearchCondition.end_created_on;
		$form.subject = $issueSearchCondition.subject;
	}
	
	var db = new TenantDatabase();
	// Find tracker list from database
	var trackerArray = db.execute("SELECT t.id, t.name FROM ib_trackers t INNER JOIN ib_projects_trackers pt ON pt.tracker_id=t.id WHERE pt.project_id=? ORDER BY position ASC",[DbParameter.number(parseInt(Client.get('project_id_session_value')))]);	
	$trackerList += '<select name="tracker_id"><option value="">'+ MessageManager.getMessage("ANY.ID") +'</option>';
	for (var i = 0; i <trackerArray.data.length; i++) {
		if(request.t && parseInt(request.t)==parseInt(trackerArray.data[i].id)){
			$trackerList += '<option value="'+trackerArray.data[i].id+'" selected >'+trackerArray.data[i].name+'</option>';
		}
		else {
			$trackerList += '<option value="'+trackerArray.data[i].id+'">'+trackerArray.data[i].name+'</option>';
		}
	}
	$trackerList += '</select>';
	
	// Find status list from database
	var statusArray = db.select("SELECT id, name, is_default FROM ib_issue_statuses WHERE is_close = 0 ORDER BY position ASC");	
	$statusList += '<select name="status_id"><option value="">'+ MessageManager.getMessage("ANY.ID") +'</option>';
	for (var i = 0; i <statusArray.data.length; i++) {
		$statusList += '<option value="'+statusArray.data[i].id+'">'+statusArray.data[i].name+'</option>';
	}
	$statusList += '</select>';
	
	// Find priority from database
	var priorityArray = db.select("SELECT id, name, is_default FROM ib_enumerations WHERE is_active = 1 ORDER BY position ASC");
	$priorityList += '<select name="priority_id"><option value="">'+ MessageManager.getMessage("ANY.ID") +'</option>';
	for (var i = 0; i <priorityArray.data.length; i++) {
		$priorityList += '<option value="'+priorityArray.data[i].id+'">'+priorityArray.data[i].name+'</option>';
	}
	$priorityList += '</select>';
	
	// Find assign to information from database
	var assignedArray = db.execute("SELECT pr.user_cd, u.user_name FROM ib_projects_users_roles pr INNER JOIN imm_user AS u ON u.user_cd = pr.user_cd WHERE project_id = ? GROUP BY pr.user_cd, u.user_name ORDER BY user_cd ASC",[DbParameter.number(parseInt(Client.get('project_id_session_value')))]);
	$assignToList += '<select name="assigned_to_id"><option value="">'+ MessageManager.getMessage("ANY.ID") +'</option>';
	for (var i = 0; i <assignedArray.data.length; i++) {
		$assignToList += '<option value="'+assignedArray.data[i].user_cd+'">'+assignedArray.data[i].user_name+'</option>';
	}
	$assignToList += '</select>';
	
	// Find author information from database
	var authorArray = db.execute("SELECT pr.user_cd, u.user_name FROM ib_projects_users_roles pr INNER JOIN imm_user AS u ON u.user_cd = pr.user_cd WHERE project_id = ? GROUP BY pr.user_cd, u.user_name ORDER BY user_cd ASC",[DbParameter.number(parseInt(Client.get('project_id_session_value')))]);
	$authorList += '<select name="author_id"><option value="">'+ MessageManager.getMessage("ANY.ID") +'</option>';
	for (var i = 0; i <authorArray.data.length; i++) {
		$authorList += '<option value="'+authorArray.data[i].user_cd+'">'+authorArray.data[i].user_name+'</option>';
	}
	$authorList += '</select>';
	
	$issueSearchTitle = MessageManager.getMessage("ISSUE.SEARCH.ID");
}

/**
 * getListメソッド
 * To get list of issues
*/
function getList(request, sync){
	//set current criteria for search
	var temp = Client.get("ib_issues/issues/list"+"$issueSearchCondition");
	if (temp != null) {
		$issueSearchCondition = temp;
	}
	if ($issueSearchCondition != null && $issueSearchCondition.backToList == "false") {
		$issueSearchCondition.page = request.page;
		$issueSearchCondition.rowNum = request.rowNum;
		$issueSearchCondition.status_id = request.status_id;
		$issueSearchCondition.tracker_id = request.tracker_id;
		$issueSearchCondition.priority_id = request.priority_id;
		$issueSearchCondition.assigned_to_id = request.assigned_to_id;
		$issueSearchCondition.progress = request.progress;
		$issueSearchCondition.author_id = request.author_id;	
		$issueSearchCondition.start_updated_on = request.start_updated_on;
		$issueSearchCondition.end_updated_on = request.end_updated_on;
		$issueSearchCondition.start_created_on = request.start_created_on;
		$issueSearchCondition.end_created_on = request.end_created_on;
		$issueSearchCondition.subject = request.subject;
		$issueSearchCondition.sortIndex = request.sortIndex;
		$issueSearchCondition.sortOrder = request.sortOrder;	
	}
	
	$issueSearchCondition.backToList = "false";
	
	var db = new TenantDatabase();
	var count = 0;
	var page   = parseInt(request.page);
	var rowNum = parseInt(request.rowNum);
	var startRow = (page - 1) * rowNum + 1;
	
	// create object for search
	var findParams = {
		count: true,
		project_id: parseInt(Client.get('project_id_session_value')),
		status_id : (isBlank($issueSearchCondition.status_id))? null : parseInt($issueSearchCondition.status_id),
		tracker_id : (isBlank($issueSearchCondition.tracker_id))? null : parseInt($issueSearchCondition.tracker_id),
		priority_id : (isBlank($issueSearchCondition.priority_id))? null : parseInt($issueSearchCondition.priority_id),
		assigned_to_id : (isBlank($issueSearchCondition.assigned_to_id))? null : $issueSearchCondition.assigned_to_id,
		progress : (isBlank($issueSearchCondition.progress))? null : parseInt($issueSearchCondition.progress),
		author_id : (isBlank($issueSearchCondition.author_id))? null : $issueSearchCondition.author_id,
		start_updated_on : (isBlank($issueSearchCondition.start_updated_on)) ? null : DateTimeFormatter.parseToDate('yyyy/MM/dd', $issueSearchCondition.start_updated_on),
		end_updated_on : (isBlank($issueSearchCondition.end_updated_on)) ? null : DateTimeFormatter.parseToDate('yyyy/MM/dd', $issueSearchCondition.end_updated_on),
		start_created_on : (isBlank($issueSearchCondition.start_created_on)) ? null : DateTimeFormatter.parseToDate('yyyy/MM/dd', $issueSearchCondition.start_created_on),
		end_created_on : (isBlank($issueSearchCondition.end_created_on)) ? null : DateTimeFormatter.parseToDate('yyyy/MM/dd', $issueSearchCondition.end_created_on),
		subject : "%" + $issueSearchCondition.subject + "%"
	}
	
	var countResult = db.executeByTemplate('ib_issues/issue_list/ib_issue_search_list',findParams);	
	count = countResult.data[0].count;
	
	findParams.count     = false;
	findParams.sortIndex = ($issueSearchCondition.sortIndex === '') ? 'i.created_on' : sortIndexes[$issueSearchCondition.sortIndex];
	findParams.sortOrder = $issueSearchCondition.sortOrder;
	
	// レコードをフェッチ
	var resultList = db.fetchByTemplate('ib_issues/issue_list/ib_issue_search_list',
						startRow,
						rowNum,
						findParams);
	
	var displayList = [];
	for (var i = 0; i < resultList.data.length; i++) {
		var d = new Date(resultList.data[i].updated_on);
		var dd = d.getDate();
		var mm = d.getMonth()+1; //January is 0!
		if(dd<10) {
			dd='0'+dd
		} 
		if(mm<10) {
			mm='0'+mm
		} 
		var updated_on_date=mm+'/'+dd+'/'+d.getFullYear();
		displayList.push({
			id : resultList.data[i].id,
			subject : resultList.data[i].subject,
			tracker : resultList.data[i].tracker,
			status : resultList.data[i].status,
			priority : resultList.data[i].priority,
			assigned_to_id : resultList.data[i].assigned_to_id,
			updated_on : String(updated_on_date)
		});
	}
	//Debug.console(displayList);
	if (!sync) {
		Client.set("ib_issues/issues/list"+"$employeeSearchCondition", $issueSearchCondition);
		var response = Web.getHTTPResponse();
		response.setContentType('application/json; charset=utf-8');
		response.sendMessageBodyString(ImJson.toJSONString({
			page:request.page,
			total:count,
			data:displayList
		}));
	} 
	else {
		Client.set("ib_issues/issues/list"+"$employeeSearchCondition", $issueSearchCondition);
		return {
			page:page,
			total:count,
			data:displayList
		};
	}
}