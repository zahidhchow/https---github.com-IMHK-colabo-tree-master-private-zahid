/**
 * 入力チェック定義オブジェクト。
 * @type Object
 */
var validateRule = {
	parent_id:{caption : MessageManager.getMessage("ISSUE.ID"), decimal: true},
	spent_on:{caption : MessageManager.getMessage("DATE.ID"), required: true},
	hours:{caption : MessageManager.getMessage("SPENT.TIME.ID"), required: true},
	activity_id:{caption : MessageManager.getMessage("ACTIVITY.ID"), required: true},
	comments:{caption : MessageManager.getMessage("COMMENT.ID"), maxlength: 255}
};

/** form to display data */
var $form = {
	project_id : "",
	id : "",
	tracker : "",
	subject : ""
}

/**
* update message display
*/
var $status = {
	error   : false,
	success : false,
	message : ''
};


/** set activity list */
var $activityList = "";

/**
 * initialization function for the page on which the value is displayed
 * 
 * @param {Request} request Request object
 */
function init(request){
	var db = new TenantDatabase();
	
	//Find the issue from database
	var issueDetails = db.execute("SELECT i.project_id, i.id, i.subject, t.name as tracker FROM ib_issues i INNER JOIN ib_trackers AS t ON i.tracker_id = t.id WHERE i.id = ?",[DbParameter.number(parseInt(request.issueid))]);
	$form = issueDetails.data[0];
	Debug.console($form);
	// Find activities from database
	var activityArray = db.select("SELECT id, name, is_default FROM ib_enumerations WHERE is_active = 1 and type=2 ORDER BY position ASC");
	$activityList += '<select name="activity_id"><option value=""></option>';
	for (var i = 0; i <activityArray.data.length; i++) {
		$activityList += '<option value="'+activityArray.data[i].id+'">'+activityArray.data[i].name+'</option>';
	}
	$activityList += '</select>';
	
	$status = Client.get('ib_issues/timespent/register' + '-status');
	Client.remove('ib_issues/timespent/register' + '-status');
}

/**
 * function for update project setting
 */

function doInsert(request) {
	var db = new TenantDatabase();
	
	// To acquire the account context.
	var accountContext = Contexts.getAccountContext();
	// To acquire the user code.
	var userCd = accountContext.userCd;	
	
	var insertObject =  {
		project_id: parseInt(Client.get('project_id_session_value')),
		user_cd: new String(userCd),
		issue_id: parseInt(request.issueid),
		comments: new String(request.comments),
		activity_id: parseInt(request.activity_id),
		spent_on: new Date(request.spent_on),
		tyear: parseInt(new Date().getFullYear()),
		tmonth: parseInt(new Date().getMonth()+1),
		tweek: parseInt(request.tweek),
		hours: new String(request.hours)
	};
	
	Transaction.begin(function() {
		var db = new TenantDatabase();
		var result = db.insert('ib_time_entries', insertObject);
		if(result.error) {
			Transaction.rollback();
			Transfer.toErrorPage({
				title: 'エラー',
				message: '登録処理時にエラーが発生しました。',
				detail: result.errorMessage
			});
		}
	});
	Client.set('ib_issues/timespent/register' + '-status', {error : false, success : true, message: '', issue_id: request.issueid, action_type: request.action_button});
}