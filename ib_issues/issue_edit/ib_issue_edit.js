/**
 * 入力チェック定義オブジェクト。
 * @type Object
 */
var validateRule = {
	subject:{caption : MessageManager.getMessage("SUBJECT.ID"), required: true, minlength: 2, maxlength: 255},
	description:{caption : MessageManager.getMessage("DESCRIPTION.ID"), maxlength: 2000},
	parent_id:{caption : MessageManager.getMessage("PARENT.TASK.ID"), decimal: true},
	comments:{caption : MessageManager.getMessage("COMMENT.ID"), maxlength: 255}
};

/** form to display data */
var $form = {
	subject : "",
	description : "",
	parent_id : "",
	start_date : "",
	due_date : "",
	estimated_hours : ""
}

/** for displaying the trackers */
var $trackerList = '';

/** for displaying the status */
var $statusList = '';

/** for displaying the priority */
var $priorityList = '';

/** for displaying the assign to */
var $assignToList = '';

/**
* update message display
*/
var $status = {
	error   : false,
	success : false,
	message : ''
};

var imgArr = [];

/** for getting project id */
var $project_id = '';

/**
* display progress list
*/
var progressArrayList = [{ label: "0%", value: "0" }, { label: "10%", value: "10" }, { label: "20%", value: "20" }, { label: "30%",	value: "30"	},
					{ label: "40%", value: "40" }, { label: "50%", value: "50" }, { label: "60%", value: "60" }, { label: "70%",	value: "70"	},
					{ label: "80%", value: "80" }, { label: "90%", value: "90" }, { label: "100%", value: "100" }];

/** for displaying the progress */
var $progressList = '';


/** set display list */
var $displayDetailFiles = "";

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
	var issueDetails = db.execute("SELECT * FROM ib_issues WHERE id = ?",[DbParameter.number(parseInt(request.issueid))]);
	if(issueDetails.data[0].parent_id==0){
		issueDetails.data[0].parent_id="";
	}
	if(issueDetails.data[0].start_date){
		var d = new Date(issueDetails.data[0].start_date);
		var dd = d.getDate();
		var mm = d.getMonth()+1; //January is 0!
		if(dd<10) {
			dd='0'+dd
		} 
		if(mm<10) {
			mm='0'+mm
		} 
		issueDetails.data[0].start_date=mm+'/'+dd+'/'+d.getFullYear();
	}
	if(issueDetails.data[0].due_date){
		var d = new Date(issueDetails.data[0].due_date);
		var dd = d.getDate();
		var mm = d.getMonth()+1; //January is 0!
		if(dd<10) {
			dd='0'+dd
		} 
		if(mm<10) {
			mm='0'+mm
		} 
		issueDetails.data[0].due_date=mm+'/'+dd+'/'+d.getFullYear();
	}
	if(issueDetails.data[0].is_private=='1' ){
		issueDetails.data[0].is_private_issue = true;
	}
	else{
		issueDetails.data[0].is_private_issue = false;
	}
	$form = issueDetails.data[0];
	
	// Find tracker list from database
	var trackerArray = db.execute("SELECT t.id, t.name FROM ib_trackers t INNER JOIN ib_projects_trackers pt ON pt.tracker_id=t.id WHERE pt.project_id=? ORDER BY position ASC",[DbParameter.number(parseInt(Client.get('project_id_session_value')))]);	
	$trackerList += '<select name="tracker_id">';
	for (var i = 0; i <trackerArray.data.length; i++) {
		$trackerList += '<option value="'+trackerArray.data[i].id+'" ';
		if(trackerArray.data[i].id==$form.tracker_id){
			$trackerList += 'selected';
		}
		$trackerList += ' >'+trackerArray.data[i].name+'</option>';
	}
	$trackerList += '</select>';
	
	// Find status list from database
	var statusArray = db.select("SELECT id, name, is_default FROM ib_issue_statuses WHERE is_close = 0 ORDER BY position ASC");	
	$statusList += '<select name="status_id">';
	for (var i = 0; i <statusArray.data.length; i++) {
		if(statusArray.data[i].id==$form.status_id){
			$statusList += '<option value="'+statusArray.data[i].id+'" selected >'+statusArray.data[i].name+'</option>';
		}
		else{
			$statusList += '<option value="'+statusArray.data[i].id+'">'+statusArray.data[i].name+'</option>';
		}
	}
	$statusList += '</select>';
	
	// Find priority from database
	var priorityArray = db.select("SELECT id, name, is_default FROM ib_enumerations WHERE is_active = 1 and type=1 ORDER BY position ASC");
	$priorityList += '<select name="priority_id">';
	for (var i = 0; i <priorityArray.data.length; i++) {
		if(priorityArray.data[i].id==$form.priority_id){
			$priorityList += '<option value="'+priorityArray.data[i].id+'" selected >'+priorityArray.data[i].name+'</option>';
		}
		else{
			$priorityList += '<option value="'+priorityArray.data[i].id+'">'+priorityArray.data[i].name+'</option>';
		}
	}
	$priorityList += '</select>';
	
	// Find assign to information from database
	var assignedArray = db.execute("SELECT pr.user_cd, u.user_name FROM ib_projects_users_roles pr INNER JOIN imm_user AS u ON u.user_cd = pr.user_cd WHERE project_id = ? GROUP BY pr.user_cd, u.user_name ORDER BY user_cd ASC",[DbParameter.number(parseInt(Client.get('project_id_session_value')))]);
	$assignToList += '<select name="assigned_to_id"><option value=""></option>';
	for (var i = 0; i <assignedArray.data.length; i++) {
		if(assignedArray.data[i].user_cd==$form.assigned_to_id){
			$assignToList += '<option value="'+assignedArray.data[i].user_cd+'" selected >'+assignedArray.data[i].user_name+'</option>';
		}
		else{
			$assignToList += '<option value="'+assignedArray.data[i].user_cd+'">'+assignedArray.data[i].user_name+'</option>';
		}		
	}
	$assignToList += '</select>';
	
	//Create progress list
	$progressList += '<select name="progress">';
	for (var i = 0; i <progressArrayList.length; i++) {
		if(progressArrayList[i].value==$form.progress){
			$progressList += '<option value="'+progressArrayList[i].value+'" selected >'+progressArrayList[i].label+'</option>';
		}
		else{
			$progressList += '<option value="'+progressArrayList[i].value+'">'+progressArrayList[i].label+'</option>';
		}		
	}
	$progressList += '</select>';
	
	// Find activities from database
	var activityArray = db.select("SELECT id, name, is_default FROM ib_enumerations WHERE is_active = 1 and type=2 ORDER BY position ASC");
	$activityList += '<select name="activity_id"><option value=""></option>';
	for (var i = 0; i <activityArray.data.length; i++) {
		if(activityArray.data[i].id==$form.priority_id){
			$activityList += '<option value="'+activityArray.data[i].id+'" selected >'+activityArray.data[i].name+'</option>';
		}
		else{
			$activityList += '<option value="'+activityArray.data[i].id+'">'+activityArray.data[i].name+'</option>';
		}
	}
	$activityList += '</select>';
	
	// Find issue files
	var issueFilesArray = db.execute("SELECT * FROM ib_issues_files WHERE issue_id = ?",[DbParameter.number(parseInt(request.issueid))]);
	
	for (var i = 0; i <issueFilesArray.data.length; i++) {
		var d = new Date(issueFilesArray.data[i].created_on);
		var hours = d.getHours();
		var minutes = d.getMinutes();
		var ampm = hours >= 12 ? 'PM' : 'AM';
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'
		hours = (hours<10)?'0'+hours:hours;
		minutes = minutes < 10 ? '0'+minutes : minutes;
		var strTime = hours + ':' + minutes + ' ' + ampm;
		var date_format = (((d.getMonth() + 1)<10)?'0'+(d.getMonth() + 1):(d.getMonth() + 1)) + '/' + ((d.getDate()<10)?'0'+(d.getDate()):(d.getDate())) + '/' +  d.getFullYear()+' '+strTime;
		var sizeFile = new PublicStorage('upload/'+issueFilesArray.data[i].filename);
		$displayDetailFiles+= '<p><img src="ui/images/attachment.png" alt="'+MessageManager.getMessage("DELETE.ID")+'"><a class="icon icon-attachment" href="ib_issues/details/download/'+issueFilesArray.data[i].id+'">'+issueFilesArray.data[i].caption+'</a>';
		$displayDetailFiles+= '<span class="size">('+bytesToSize(sizeFile.length())+')</span><a title="'+MessageManager.getMessage("DELETE.ID")+'" rel="nofollow" onclick="return confirm(\''+MessageManager.getMessage("ARE.YOU.SURE.ID")+'\');" class="delete" href="ib_issues/edit/file/'+issueFilesArray.data[i].id+'">';
		$displayDetailFiles+= '<img src="ui/images/delete.png" alt="'+MessageManager.getMessage("DELETE.ID")+'"></a><span class="author">'+issueFilesArray.data[i].created_by+', '+date_format+'</span></p>';
	}
	
	$status = Client.get('ib_issues/edit' + '-status');
	
	//Delete session files if exist
	if(Client.get('imgArrSess')){
		var imgArr = Client.get('imgArrSess');
		for(var i=0; i<imgArr.length; i++){
			var deleteFile = new PublicStorage('upload/'+imgArr[i]);
			if (deleteFile.exists()) {
				deleteFile.remove();
				Logger.getLogger().info("File has been removed.");
			}
		}
	}
	
	//sendMail();
	Client.remove('imgArrSess');
	Client.remove('ib_issues/edit' + '-status');
}

/**
 * function for update project setting
 */

function doUpdate(request) {
	var db = new TenantDatabase();
	//Find the issue from database
	var issueDetails = db.execute("SELECT * FROM ib_issues WHERE id = ?",[DbParameter.number(parseInt(request.issueid))]);
	
	// To acquire the account context.
	var accountContext = Contexts.getAccountContext();
	// To acquire the user code.
	var userCd = accountContext.userCd;
	//update emission email address
	var updateObject =  {
		project_id: parseInt(Client.get('project_id_session_value')),
		tracker_id: parseInt(request.tracker_id),
		subject: new String(request.subject),
		status_id: parseInt(request.status_id),
		priority_id: parseInt(request.priority_id),
		author_id: new String(userCd),
		progress: parseInt(request.progress)
	};
	if(request.description!=""){
		updateObject.description = new String(request.description);
	}
	else{
		updateObject.description = null;
	}
	if(request.parent_id!=""){
		updateObject.parent_id = parseInt(request.parent_id);
	}
	else{
		updateObject.parent_id = null;
	}
	if(request.assigned_to_id!=""){
		updateObject.assigned_to_id =new String(request.assigned_to_id);
	}
	else{
		updateObject.assigned_to_id = null;
	}
	if(request.start_date!=""){
		updateObject.start_date =  new Date(request.start_date);
	}
	else{
		updateObject.start_date = null;
	}
	if(request.due_date!=""){
		updateObject.due_date = new Date(request.due_date);
	}
	else{
		updateObject.due_date = null;
	}
	if(request.estimated_hours!=""){
		updateObject.estimated_hours = new String(request.estimated_hours);
	}
	else{
		updateObject.estimated_hours = null;
	}
	
	if(request.is_private_issue==1){
		updateObject.is_private = 1;
	}
	else{
		updateObject.is_private = 0;
	}
	
	var imgLog = "";
	// insert issue to database
	Transaction.begin(function() {
		var db = new TenantDatabase();
		var result = db.update('ib_issues',
		updateObject,
		'id = ? ',
		[
			DbParameter.number(parseInt(request.issueid))
		]);
		if(result.error) {
			Transaction.rollback();
			Transfer.toErrorPage({
				title: 'エラー',
				message: '登録処理時にエラーが発生しました。',
				detail: result.errorMessage
			});
		}
		
		var imgArr = Client.get('imgArrSess');
		if(imgArr){
			for(var i=0; i<imgArr.length; i++){
				var imgCap = new String(imgArr[i]);
				var imgCapGet = imgCap.split("_");
				var imgCaption = removeA(imgCapGet, imgCapGet[0]).join('_');
				var insertFiles =  {
					issue_id: parseInt(request.issueid),
					filename: new String(imgArr[i]),
					caption: new String(imgCaption),
					created_by: new String(userCd)
				};
				var result = db.insert('ib_issues_files', insertFiles);
				var lastID = db.select("SELECT currval(pg_get_serial_sequence('ib_issues_files','id')) as last_insert_id");
				var last_insert_id = lastID.data[0].last_insert_id;
				imgLog += '<li><strong>'+MessageManager.getMessage("FILE.ID")+'</strong> <a href="ib_issues/details/download/'+last_insert_id+'">'+imgCaption+'</a> added </li>';
			}
		}
		Client.remove('imgArrSess');
	});
	
	var update_status = 0;
	var is_description_change = 0;
	var change_log = '<ul class="details">';
	if(issueDetails.data[0].tracker_id!=request.tracker_id){
		update_status = 1;
		var oldTrackerArray = db.select("SELECT name FROM ib_trackers WHERE id ='"+parseInt(issueDetails.data[0].tracker_id)+"'");
		var newTrackerArray = db.select("SELECT name FROM ib_trackers WHERE id ='"+parseInt(request.tracker_id)+"'");	
		change_log += '<li><strong>'+MessageManager.getMessage("TRACKER.ID")+'</strong> '+MessageManager.getMessage("CHANGED.ID")+' '+MessageManager.getMessage("FROM.ID")+' <i>'+oldTrackerArray.data[0].name+'</i> '+MessageManager.getMessage("TO.ID")+' <i>'+newTrackerArray.data[0].name+'</i></li>';
	}
	if(issueDetails.data[0].subject!=request.subject){
		update_status = 1;
		change_log += '<li><strong>'+MessageManager.getMessage("SUBJECT.ID")+'</strong> '+MessageManager.getMessage("CHANGED.ID")+' '+MessageManager.getMessage("FROM.ID")+' <i>'+issueDetails.data[0].subject+'</i> '+MessageManager.getMessage("TO.ID")+' <i>'+request.subject+'</i></li>';
	}
	if(issueDetails.data[0].description!=request.description){
		//update_status = 1;
		is_description_change = 1;
		//change_log += '<li><strong>'+MessageManager.getMessage("DESCRIPTION.ID")+'</strong> updated </li>';
	}
	if(issueDetails.data[0].status_id!=request.status_id){
		update_status = 1;
		var oldStatusArray = db.select("SELECT name FROM ib_issue_statuses WHERE id = '"+parseInt(issueDetails.data[0].status_id)+"'");
		var newStatusArray = db.select("SELECT name FROM ib_issue_statuses WHERE id = '"+parseInt(request.tracker_id)+"'");
		change_log += '<li><strong>'+MessageManager.getMessage("STATUS.ID")+'</strong> '+MessageManager.getMessage("CHANGED.ID")+' '+MessageManager.getMessage("FROM.ID")+' <i>'+oldStatusArray.data[0].name+'</i> '+MessageManager.getMessage("TO.ID")+' <i>'+newStatusArray.data[0].name+'</i></li>';
	}
	if(issueDetails.data[0].parent_id!=request.parent_id){
		if(!issueDetails.data[0].parent_id && request.parent_id==''){
			//no action
		}
		else if(issueDetails.data[0].parent_id && request.parent_id==''){
			update_status = 1;
			change_log += '<li><strong>'+MessageManager.getMessage("PARENT.TASK.ID")+'</strong> '+MessageManager.getMessage("DELETED.ID")+' (<del><i>#'+issueDetails.data[0].parent_id+'</i></del>)</li>';
		}
		else if(!issueDetails.data[0].parent_id && request.parent_id!=''){
			update_status = 1;
			change_log += '<li><strong>'+MessageManager.getMessage("PARENT.TASK.ID")+'</strong> '+MessageManager.getMessage("SET.ID")+' '+MessageManager.getMessage("TO.ID")+' <i>#'+request.parent_id+'</i></li>';
		}
		else{
			update_status = 1;
			change_log += '<li><strong>'+MessageManager.getMessage("PARENT.TASK.ID")+'</strong> '+MessageManager.getMessage("CHANGED.ID")+' '+MessageManager.getMessage("FROM.ID")+' <i>#'+issueDetails.data[0].parent_id+'</i> '+MessageManager.getMessage("TO.ID")+' <i>#'+request.parent_id+'</i></li>';
		}
	}
	if(issueDetails.data[0].priority_id!=request.priority_id){
		update_status = 1;
		var oldPriorityArray = db.select("SELECT name FROM ib_enumerations WHERE id = '"+parseInt(issueDetails.data[0].priority_id)+"'");
		var newPriorityArray = db.select("SELECT name FROM ib_enumerations WHERE id = '"+parseInt(request.priority_id)+"'");
		change_log += '<li><strong>'+MessageManager.getMessage("PRIORITY.ID")+'</strong> '+MessageManager.getMessage("CHANGED.ID")+' '+MessageManager.getMessage("FROM.ID")+' <i>'+oldPriorityArray.data[0].name+'</i> '+MessageManager.getMessage("TO.ID")+' <i>'+newPriorityArray.data[0].name+'</i></li>';
	}
	if(issueDetails.data[0].assigned_to_id!=request.assigned_to_id){
		if(!issueDetails.data[0].assigned_to_id && request.assigned_to_id==''){
			//no action
		}
		else if(issueDetails.data[0].assigned_to_id && request.assigned_to_id==''){
			update_status = 1;
			change_log += '<li><strong>'+MessageManager.getMessage("ASSIGN.TO.ID")+'</strong> '+MessageManager.getMessage("DELETED.ID")+' (<del><i>'+issueDetails.data[0].assigned_to_id+'</i></del>)</li>';
		}
		else if(!issueDetails.data[0].assigned_to_id && request.assigned_to_id!=''){
			update_status = 1;
			change_log += '<li><strong>'+MessageManager.getMessage("ASSIGN.TO.ID")+'</strong> '+MessageManager.getMessage("SET.ID")+' '+MessageManager.getMessage("TO.ID")+' <i>'+request.assigned_to_id+'</i></li>';
		}
		else{
			update_status = 1;
			change_log += '<li><strong>'+MessageManager.getMessage("ASSIGN.TO.ID")+'</strong> '+MessageManager.getMessage("CHANGED.ID")+' '+MessageManager.getMessage("FROM.ID")+' <i>'+issueDetails.data[0].assigned_to_id+'</i> '+MessageManager.getMessage("TO.ID")+' <i>'+request.assigned_to_id+'</i></li>';
		}
	}
	if(issueDetails.data[0].start_date!=request.start_date){
		if(!issueDetails.data[0].start_date && request.start_date==''){
			//no action
		}
		else if(issueDetails.data[0].start_date && request.start_date==''){
			update_status = 1;
			var d = new Date(issueDetails.data[0].start_date);
			var start_date_format = (((d.getMonth() + 1)<10)?'0'+(d.getMonth() + 1):(d.getMonth() + 1)) + '/' + ((d.getDate()<10)?'0'+(d.getDate()):(d.getDate())) + '/' +  d.getFullYear();
			change_log += '<li><strong>'+MessageManager.getMessage("START.DATE.ID")+'</strong> '+MessageManager.getMessage("DELETED.ID")+' (<del><i>'+start_date_format+'</i></del>)</li>';
		}
		else if(!issueDetails.data[0].start_date && request.start_date!=''){
			update_status = 1;
			change_log += '<li><strong>'+MessageManager.getMessage("START.DATE.ID")+'</strong> '+MessageManager.getMessage("SET.ID")+' '+MessageManager.getMessage("TO.ID")+' <i>'+request.due_date+'</i></li>';
		}
		else{
			var d = new Date(issueDetails.data[0].start_date);
			var start_date_format = (((d.getMonth() + 1)<10)?'0'+(d.getMonth() + 1):(d.getMonth() + 1)) + '/' + ((d.getDate()<10)?'0'+(d.getDate()):(d.getDate())) + '/' +  d.getFullYear();
			if(start_date_format!=request.start_date){
				update_status = 1;
				change_log += '<li><strong>'+MessageManager.getMessage("START.DATE.ID")+'</strong> '+MessageManager.getMessage("CHANGED.ID")+' '+MessageManager.getMessage("FROM.ID")+' <i>'+start_date_format+'</i> '+MessageManager.getMessage("TO.ID")+' <i>'+request.start_date+'</i></li>';
			}
		}
	}
	if(issueDetails.data[0].due_date!=request.due_date){
		if(!issueDetails.data[0].due_date && request.due_date==''){
			//no action			
		}
		else if(issueDetails.data[0].due_date && request.due_date==''){
			update_status = 1;
			var d = new Date(issueDetails.data[0].due_date);
			var due_date_format = (((d.getMonth() + 1)<10)?'0'+(d.getMonth() + 1):(d.getMonth() + 1)) + '/' + ((d.getDate()<10)?'0'+(d.getDate()):(d.getDate())) + '/' +  d.getFullYear();
			change_log += '<li><strong>'+MessageManager.getMessage("DUE.DATE.ID")+'</strong> '+MessageManager.getMessage("DELETED.ID")+' (<del><i>'+due_date_format+'</i></del>)</li>';
		}
		else if(!issueDetails.data[0].due_date && request.due_date!=''){
			update_status = 1;
			change_log += '<li><strong>'+MessageManager.getMessage("DUE.DATE.ID")+'</strong> '+MessageManager.getMessage("SET.ID")+' '+MessageManager.getMessage("TO.ID")+' <i>'+request.due_date+'</i></li>';
		}
		else{
			var d = new Date(issueDetails.data[0].due_date);
			var due_date_format = (((d.getMonth() + 1)<10)?'0'+(d.getMonth() + 1):(d.getMonth() + 1)) + '/' + ((d.getDate()<10)?'0'+(d.getDate()):(d.getDate())) + '/' +  d.getFullYear();
			if(due_date_format!=request.due_date){
				update_status = 1;
				change_log += '<li><strong>'+MessageManager.getMessage("DUE.DATE.ID")+'</strong> '+MessageManager.getMessage("CHANGED.ID")+' '+MessageManager.getMessage("FROM.ID")+' <i>'+due_date_format+'</i> '+MessageManager.getMessage("TO.ID")+' <i>'+request.due_date+'</i></li>';
			}
		}
	}
	if(issueDetails.data[0].estimated_hours!=request.estimated_hours){
		update_status = 1;
		change_log += '<li><strong>'+MessageManager.getMessage("ESTIMATED.TIME.ID")+'</strong> '+MessageManager.getMessage("CHANGED.ID")+' '+MessageManager.getMessage("FROM.ID")+' <i>'+issueDetails.data[0].estimated_hours+'</i> '+MessageManager.getMessage("TO.ID")+' <i>'+request.estimated_hours+'</i></li>';
	}
	if(issueDetails.data[0].progress!=request.progress){
		update_status = 1;
		change_log += '<li><strong>'+MessageManager.getMessage("PROGRESS.ID")+'</strong> '+MessageManager.getMessage("CHANGED.ID")+' '+MessageManager.getMessage("FROM.ID")+' <i>'+issueDetails.data[0].progress+'</i> '+MessageManager.getMessage("TO.ID")+' <i>'+request.progress+'</i></li>';
	}
	if(imgLog!=""){
		update_status = 1;
		change_log += imgLog;
	}
	change_log += '</ul>';
	if(update_status == 1 || is_description_change==1){
		var insertChangeObject =  {
			updated_by: new String(userCd),
			issue_id: parseInt(request.issueid),
			notes: new String(request.notes)
		}
		if(update_status == 1){
			insertChangeObject.change_list =  new String(change_log);
		}
		if(is_description_change == 1){
			insertChangeObject.is_description_change = 1;
			insertChangeObject.description =  new String(issueDetails.data[0].description);
		}
		else{
			insertChangeObject.is_description_change = 0;
		}
		if(request.notes!=''){
			insertChangeObject.notes = request.notes;
		}
		if(request.is_private==1){
			insertChangeObject.is_private = 1;
		}
		else{
			insertChangeObject.is_private = 0;
		}
		Transaction.begin(function() {
			var db = new TenantDatabase();
			var result = db.insert('ib_issues_changes', insertChangeObject);
			if(result.error) {
				Transaction.rollback();
				Transfer.toErrorPage({
					title: 'エラー',
					message: '登録処理時にエラーが発生しました。',
					detail: result.errorMessage
				});
			}
		});
	}
	if(request.hours!=''){
		var insertCommentObject =  {
			project_id: parseInt(Client.get('project_id_session_value')),
			user_cd: new String(userCd),
			issue_id: parseInt(request.issueid),
			comments: new String(request.comments),
			activity_id: parseInt(request.activity_id),
			spent_on: new Date(),
			tyear: parseInt(new Date().getFullYear()),
			tmonth: parseInt(new Date().getMonth()+1),
			tweek: parseInt(request.tweek),
			hours: new String(request.hours)
		};
		
		Transaction.begin(function() {
			var db = new TenantDatabase();
			var result = db.insert('ib_time_entries', insertCommentObject);
			if(result.error) {
				Transaction.rollback();
				Transfer.toErrorPage({
					title: 'エラー',
					message: '登録処理時にエラーが発生しました。',
					detail: result.errorMessage
				});
			}
		});
	}	
	Client.set('ib_issues/edit' + '-status', {error : false, success : true, message: '', issue_id: request.issueid});
}

/**
* Function to generate autocomplete to issue
*/
	
function doAutocomplete(request){
	var db = new TenantDatabase();
	var issueArray = db.select("SELECT id , id as value,  id||' - '||subject as label FROM ib_issues WHERE project_id='"+request.pid+"' AND id!='"+request.issue_id+"' AND (lower(id||' - '||subject) LIKE '%"+request.term.toLowerCase()+"%')");
	var displayList = [];
	for (var i = 0; i < issueArray.data.length; i++) {
		displayList.push({
			id : issueArray.data[i].id,
			value : issueArray.data[i].value,
			label : issueArray.data[i].label
		});
	}
	var jsonString = ImJson.toJSONString (displayList);
	var response = Web.getHTTPResponse ();
	response.setContentType ("application / json; charset = UTF-8");
	response.sendMessageBodyString (jsonString);
	//return displayList;
}

/**
* function for file upload
*/
function doUpload(request){	
	var cryption = new Packages.jp.co.intra_mart.system.imtag.SecureParameterCryption();
	var response = Web.getHTTPResponse();
	response.setContentType('text/plain; charset=utf-8');
	
	try {
		// Creating a destination
		var dir = 'upload';
		var storedDirectory = new PublicStorage(dir);
		
		storedDirectory.makeDirectories();
		// Save File data
		var upfile = request.getParameter("local_file");
		var timestamp = new Date().getUTCMilliseconds();
		var newFileName = timestamp+'_'+upfile.getFileName();
		upfile.openValueAsBinary(function(reader) {
			var storage = new PublicStorage(dir, newFileName);
			storage.createAsBinary(function(writer, err) {
				if (err) {
					Logger.getLogger().error(err.message);
					response.sendMessageBodyString(ImJson.toJSONString([{
						"error":MessageManager.getMessage("FILE.UPLOAD.ERROR.ID")
					}]));
				}
				reader.transferTo(writer);
			});
		});
		
		//Acquisition of data file that you saved
		var storedFile = new PublicStorage(dir, newFileName);
		var storedFileSize = storedFile.length();
		if (storedFileSize == null || storedFileSize == 0 || storedFileSize >= 2000000) {
			if (storedFile.exists()) {
				storedFile.remove();
			}
			var message;
			if (storedFileSize == null) {
				message = MessageManager.getMessage("GET.FILE.SIZE.ERROR.ID");
			} else if (storedFileSize == 0) {
				message = MessageManager.getMessage("EMPTY.FILE.ERROR.ID");
			} else if (storedFileSize >= 2000000) {
				message = MessageManager.getMessage("MAX.FILE.SIZE.LIMIT.ERROR.ID");
			}
			response.sendMessageBodyString(ImJson.toJSONString([{
				"error":message
			}]));
		}
		
		//add files to array
		if(Client.get('imgArrSess')){
			var imgArr = Client.get('imgArrSess');
			Client.remove('imgArrSess');
		}
		else{
			var imgArr = [];	
		}
		imgArr.push(newFileName);
		Client.set('imgArrSess',imgArr);
		
		response.sendMessageBodyString(ImJson.toJSONString([{
			"name":upfile.getFileName(),
			"size":storedFileSize,
			"deleteUrl":'ib_issues/edit/fileremove/' + URL.encode(cryption.encrypt(storedFile.getCanonicalPath()),"UTF-8"),
			"deleteType":'POST'
		}]));
	} 
	catch(e) {
		// Return the error information
		response.sendMessageBodyString(ImJson.toJSONString([{
			"error":e.message
		}]));
	}
}

/**
* Function to delete files from physical location
* 
* @param request
*/
function doFileRemove(request){
	var cryption = new Packages.jp.co.intra_mart.system.imtag.SecureParameterCryption();
	var response = Web.getHTTPResponse();
	response.setContentType('text/plain; charset=utf-8');
	var deleteFileParam = request.getParameter("delete");
	var deleteFile = new PublicStorage(URL.decode(cryption.decrypt(deleteFileParam.getValue()), "UTF-8"));
	if (deleteFile.exists()) {
		deleteFile.remove();
		Logger.getLogger().info("File has been removed.");
	}

	var imgArr = Client.get('imgArrSess');
	var rmvImgArr = removeA(imgArr, deleteFile.getName())
	Client.set('imgArrSess',rmvImgArr);
	
	response.sendMessageBodyString(ImJson.toJSONString([{
		"name":deleteFile.getName()
	}]));
}

/**
* Function to remove index form an array
* 
* @param arr is an array
*/
function removeA(arr) {
	var what, a = arguments, L = a.length, ax;
	while (L > 1 && arr.length) {
		what = a[--L];
		while ((ax= arr.indexOf(what)) !== -1) {
			arr.splice(ax, 1);
		}
	}
	return arr;
}

/**
* Remove file from physical location and database
* 
* @param request
*/

function doUploadFileRemove(request){	
	var db = new TenantDatabase();
	var issueFileArray = db.execute("SELECT * FROM ib_issues_files WHERE id = ?",[DbParameter.number(parseInt(request.fileid))]);
	
	var deleteFile = new PublicStorage('upload/'+issueFileArray.data[0].filename);
	if (deleteFile.exists()) {
		deleteFile.remove();
		Logger.getLogger().info("File has been removed.");
	}
	// トランザクション開始
	Transaction.begin(function() {
		var db = new TenantDatabase();
		var result = db.remove('ib_issues_files',
		'id = ? ',
		[
		DbParameter.number(parseInt(request.fileid))
		]);
	
	// エラー時ロールバック
	if(result.error) {
		Transaction.rollback();
		Transfer.toErrorPage({
			title: 'エラー',
	essage: '削除処理時にエラーが発生しました。',
				detail: result.errorMessage
			});
		}
	});
	secureRedirect('ib_issues/edit/'+issueFileArray.data[0].issue_id, {});
}

/**
* Function to convert Bytes to 'KB', 'MB', 'GB', 'TB'
* 
* @param bytes
*/
function bytesToSize(bytes) {
	var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	if (bytes == 0) return '0 Byte';
	var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
	return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};

function sendMail(){
		var mSender = new MailSender();
		mSender.addTo("zahid.chowdhury@bjitgroup.com");
		mSender.setFrom("admin@bjitgroup.com");
		mSender.setSubject("hello");
		mSender.setText("Test email");
		mSender.send();
}