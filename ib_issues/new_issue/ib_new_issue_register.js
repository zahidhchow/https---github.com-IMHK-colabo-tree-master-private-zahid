/**
 * 入力チェック定義オブジェクト。
 * @type Object
 */
var validateRule = {
	subject:{caption : MessageManager.getMessage("SUBJECT.ID"), required: true, minlength: 2, maxlength: 255},
	description:{caption : MessageManager.getMessage("DESCRIPTION.ID"), maxlength: 2000},
	parent_id:{caption : MessageManager.getMessage("PARENT.TASK.ID"), decimal: true}
};

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
var progressList = [{ label: "0%", value: "0" }, { label: "10%", value: "10" }, { label: "20%", value: "20" }, { label: "30%",	value: "30"	},
					{ label: "40%", value: "40" }, { label: "50%", value: "50" }, { label: "60%", value: "60" }, { label: "70%",	value: "70"	},
					{ label: "80%", value: "80" }, { label: "90%", value: "90" }, { label: "100%", value: "100" }];

/**
 * initialization function for the page on which the value is displayed
 * 
 * @param {Request} request Request object
 */
function init(request){
	var db = new TenantDatabase();
	
	//Assign project id to variable for using on HTML
	$project_id = request.pid;
	//Assign project id to session
	Client.set('project_id_session_value', request.pid);
	
	// Find tracker list from database
	var trackerArray = db.execute("SELECT t.id, t.name FROM ib_trackers t INNER JOIN ib_projects_trackers pt ON pt.tracker_id=t.id WHERE pt.project_id=? ORDER BY position ASC",[DbParameter.number(parseInt(Client.get('project_id_session_value')))]);	
	$trackerList += '<select name="tracker_id">';
	for (var i = 0; i <trackerArray.data.length; i++) {
		$trackerList += '<option value="'+trackerArray.data[i].id+'">'+trackerArray.data[i].name+'</option>';
	}
	$trackerList += '</select>';
	
	// Find status list from database
	var statusArray = db.select("SELECT id, name, is_default FROM ib_issue_statuses WHERE is_close = 0 ORDER BY position ASC");	
	$statusList += '<select name="status_id">';
	for (var i = 0; i <statusArray.data.length; i++) {
		if(statusArray.data[i].is_default==1){
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
		if(priorityArray.data[i].is_default==1){
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
		$assignToList += '<option value="'+assignedArray.data[i].user_cd+'">'+assignedArray.data[i].user_name+'</option>';
	}
	$assignToList += '</select>';
	$status = Client.get('ib_issues/register' + '-status');
	
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
	Client.remove('ib_issues/register' + '-status');
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
	//update emission email address
	var insertObject =  {
		project_id: parseInt(Client.get('project_id_session_value')),
		tracker_id: parseInt(request.tracker_id),
		subject: new String(request.subject),
		status_id: parseInt(request.status_id),
		priority_id: parseInt(request.priority_id),
		author_id: new String(userCd),
		progress: parseInt(request.progress)
	};
	if(request.description!=""){
		insertObject.description = new String(request.description);
	}
	if(request.parent_id!=""){
		insertObject.parent_id = parseInt(request.parent_id);
	}
	if(request.assigned_to_id!=""){
		insertObject.assigned_to_id =new String(request.assigned_to_id);
	}
	if(request.start_date!=""){
		insertObject.start_date =  new Date(request.start_date);
	}
	if(request.due_date!=""){
		insertObject.due_date = new Date(request.due_date);
	}
	if(request.estimated_hours!=""){
		insertObject.estimated_hours = new String(request.estimated_hours);
	}
	
	if(request.is_private_issue==1){
		insertObject.is_private = 1;
	}
	else{
		insertObject.is_private = 0;
	}
	var last_insert_id;
	// insert issue to database
	Transaction.begin(function() {
		var db = new TenantDatabase();
		var result = db.insert('ib_issues', insertObject);
		if(result.error) {
			Transaction.rollback();
			Transfer.toErrorPage({
				title: 'エラー',
				message: '登録処理時にエラーが発生しました。',
				detail: result.errorMessage
			});
		}
		var lastID = db.select("SELECT currval(pg_get_serial_sequence('ib_issues','id')) as last_insert_id");
		last_insert_id = lastID.data[0].last_insert_id;
		var imgArr = Client.get('imgArrSess');
		if(imgArr){
			for(var i=0; i<imgArr.length; i++){
				var imgCap = new String(imgArr[i]);
				var imgCapGet = imgCap.split("_");
				var imgCaption = removeA(imgCapGet, imgCapGet[0]).join('_');
				var insertFiles =  {
					issue_id: parseInt(last_insert_id),
					filename: new String(imgArr[i]),
					caption: new String(imgCaption),
					created_by: new String(userCd)
				};
				var result = db.insert('ib_issues_files', insertFiles);
			}		
		}
		Client.remove('imgArrSess');
	});
	if(request.action_button=='create'){
		$project_id = last_insert_id;
	}
	else{
		$project_id = Client.get('project_id_session_value');
	}
	
	Client.set('ib_issues/register' + '-status', {error : false, success : true, message: '', project_id: $project_id, action_type: request.action_button});
}

/**
* Function to generate autocomplete to issue
*/
	
function doAutocomplete(request){
	var db = new TenantDatabase();
	var issueArray = db.select("SELECT id , id as value,  id||' - '||subject as label FROM ib_issues WHERE project_id='"+request.pid+"' AND (lower(id||' - '||subject) LIKE '%"+request.term.toLowerCase()+"%')");
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
			"deleteUrl":'ib_issues/register/fileremove/' + URL.encode(cryption.encrypt(storedFile.getCanonicalPath()),"UTF-8"),
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

function sendMail(){
		var mSender = new MailSender();
		mSender.addTo("zahid.chowdhury@bjitgroup.com","Zahid");
		mSender.setFrom("admin@bjitgroup.com","Admin");
		mSender.setSubject("test");
		mSender.setText("Test email");
		mSender.send();
}