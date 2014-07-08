/** initial page set */
var $page = 1;

/**
 * 入力チェック定義オブジェクト。
 * @type Object
 */
var validateRule = {
	page   : {caption: 'page', integer:true},
	rowNum : {caption: 'rowNum', integer:true},
	sortIndex : {caption : 'sortIndex', isIn:['project_id','spent_on','user_cd','activity_id','issue_id','comments','hours']},
	sortOrder: {caption : 'sortOrder', isIn:['asc', 'desc']}
};

/**
 * ソートキーに対応するテーブルのフィールド名
 */
var sortIndexes = {
	project_id : 'p.name',
	spent_on : 'spent_on',
	user_cd : 'u.user_name',
	activity_id : 'e.name',
	issue_id : 'i.subject',
	comments : 'comments',
	hours : 'hours'
};

/** initial search condition */
var $timeSearchCondition = {
		page : "",
		rowNum : "",
		sortIndex : "",
		sortOrder : "",
		backToList : "false"
};

/** initialize issue id to use on html */
var $issueID = '';

/**
 * initialization function for the page on which the value is displayed
 * 
 * @param {Request} request Request object
 */
function init(request){	
	$timeSearchCondition = Client.get("ib_issues/issues/list"+"$timeSearchCondition");
	$issueID = request.issueid;
}

/**
 * getListメソッド
 * To get list of issues
*/
function getList(request, sync){	
	var temp = Client.get("ib_issues/issues/list"+"$issueSearchCondition");
	if (temp != null) {
		$timeSearchCondition = temp;
	}
	if ($timeSearchCondition != null && $timeSearchCondition.backToList == "false") {
		$timeSearchCondition.page = request.page;
		$timeSearchCondition.rowNum = request.rowNum;
		$timeSearchCondition.sortIndex = request.sortIndex;
		$timeSearchCondition.sortOrder = request.sortOrder;	
	}
	
	$timeSearchCondition.backToList = "false";
	var db = new TenantDatabase();
	var count = 0;
	var page   = parseInt(request.page);
	var rowNum = parseInt(request.rowNum);
	var startRow = (page - 1) * rowNum + 1;
	// create object for search
	var findParams = {
		count: true,
		issue_id: parseInt(request.issueid)
	}
	var countResult = db.executeByTemplate('ib_issues/time_spent/ib_time_spent_list',findParams);
	count = countResult.data[0].count;
	findParams.count	 = false;
	findParams.sortIndex = ($timeSearchCondition.sortIndex === '') ? 'created_on' : sortIndexes[$timeSearchCondition.sortIndex];
	findParams.sortOrder = $timeSearchCondition.sortOrder;
	
	// レコードをフェッチ
	var resultList = db.fetchByTemplate('ib_issues/time_spent/ib_time_spent_list',
						startRow,
						rowNum,
						findParams);
	
	var displayList = [];
	var spent_time = 0;
	for (var i = 0; i < resultList.data.length; i++) {
		var issueHours = resultList.data[i].hours.split(":");
		spent_time += (parseInt(issueHours[0])*60) + parseInt(issueHours[1]);		
		var d = new Date(resultList.data[i].spent_on);
		var dd = d.getDate();
		var mm = d.getMonth()+1; //January is 0!
		if(dd<10) {
			dd='0'+dd
		} 
		if(mm<10) {
			mm='0'+mm
		} 
		var spent_on_date=mm+'/'+dd+'/'+d.getFullYear();
		displayList.push({
			project_id : resultList.data[i].project_name,
			spent_on : String(spent_on_date),
			user_cd : resultList.data[i].user_name,
			activity_id : resultList.data[i].activity,
			issue_id : resultList.data[i].tracker+' # '+resultList.data[i].issue_id+': '+resultList.data[i].subject,
			comments : resultList.data[i].comments,
			hours : String(resultList.data[i].hours)
		});
	}
	
	var total_spent_time = parseInt(spent_time/60)+':'+(spent_time%60);
	if (!sync) {
		Client.set("ib_issues/timespent/list"+"$timeSearchCondition", $timeSearchCondition);
		var response = Web.getHTTPResponse();
		response.setContentType('application/json; charset=utf-8');
		response.sendMessageBodyString(ImJson.toJSONString({
			page:request.page,
			total:count,
			data:displayList,
			total_spent_time:total_spent_time
		}));
	} 
	else {
		Client.set("ib_issues/timespent/list"+"$employeeSearchCondition", $timeSearchCondition);
		return {
			page:page,
			total:count,
			data:displayList,
			total_spent_time:total_spent_time
		};
	}
}