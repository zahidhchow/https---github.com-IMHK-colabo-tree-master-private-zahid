/**
 * 入力チェック定義オブジェクト。
 * @type Object
 */
var validateRule = {
	name:{caption : MessageManager.getMessage("NAME.ID"), required: true, minlength: 2, maxlength: 255},
	identifier:{caption : MessageManager.getMessage("IDENTIFIER.ID"), required: true, minlength: 1, maxlength: 100, lowercase: true},
	homepage:{caption : MessageManager.getMessage("HOMEPAGE.ID"), url: true, maxlength: 255}
};

/**
* update message display
*/
var $status = {
	error   : false,
	success : false,
	message : ''
};

/** for displaying the projects list */
var $projectsList = '';

/** for displaying the tracker list */
var $trackerList = '';

/** for displaying the module list */
var $moduleList = '';

/** for displaying the module list */
var $isPublic = false;
/**
 * initialization function for the page on which the value is displayed
 * 
 * @param {Request} request Request object
 */
function init(request){
	var db = new TenantDatabase();
	
	//Find project default setting
	var projectSeetingArray = db.select("SELECT id, name, value FROM ib_settings WHERE name='default_projects_public' OR name='default_projects_module_ids'  OR name='default_projects_tracker_ids' ORDER BY name ASC");
	var resModules = projectSeetingArray.data[0].value.split(",");
	var resDefaultPublics = projectSeetingArray.data[1].value;
	if(projectSeetingArray.data[1].value=='1'){
		$isPublic = true;
	}
	
	var resTrackers = projectSeetingArray.data[2].value.split(",");
	
	// Find project list from database
	var projectArray = db.select("SELECT id, name FROM ib_projects WHERE status=1 ORDER BY name ASC");	
	$projectsList += '<select name="parent_id"><option value=""></option>';
	for (var i = 0; i <projectArray.data.length; i++) {
		$projectsList += '<option value="'+projectArray.data[i].id+'">'+projectArray.data[i].name+'</option>';
	}
	$projectsList += '</select>';
	
	// Find module list from database
	var moduleArray = db.select("SELECT id, name FROM ib_modules");	
	for (var i = 0; i <moduleArray.data.length; i++) {
		if(inArray(moduleArray.data[i].id, resModules)){
			$moduleList += '<label class="floatinglevel"><input type="checkbox" value="'+moduleArray.data[i].id+'" name="enabled_module_names[]" checked="checked">'+moduleArray.data[i].name+'</label>';
		}
		else{
			$moduleList += '<label class="floatinglevel"><input type="checkbox" value="'+moduleArray.data[i].id+'" name="enabled_module_names[]">'+moduleArray.data[i].name+'</label>';
		}
	}
	
	// Find tracker list from database
	var trackerArray = db.select("SELECT id, name FROM ib_trackers");	
	for (var i = 0; i <trackerArray.data.length; i++) {
		if(inArray(trackerArray.data[i].id, resTrackers)){
			$trackerList += '<label class="floatinglevel"><input type="checkbox" value="'+trackerArray.data[i].id+'" name="tracker_ids[]" checked="checked">'+trackerArray.data[i].name+'</label>';
		}
		else{
			$trackerList += '<label class="floatinglevel"><input type="checkbox" value="'+trackerArray.data[i].id+'" name="tracker_ids[]">'+trackerArray.data[i].name+'</label>';
		}
	}
	$status = Client.get('ib_projects/register' + '-status');
	Client.remove('ib_projects/register' + '-status');
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
		name: new String(request.name),
		identifier: new String(request.identifier),
		created_by: new String(userCd)
	};
	if(request.description!=""){
		insertObject.description = new String(request.description);
	}
	if(request.parent_id!=""){
		insertObject.parent_id = parseInt(request.parent_id);
	}
	if(request.homepage!=""){
		insertObject.homepage =new String(request.homepage);
	}
	
	if(request.is_public==1){
		insertObject.is_public = 1;
	}
	else{
		insertObject.is_public = 0;
	}
	var last_insert_id;
	// insert issue to database
	Transaction.begin(function() {
		var db = new TenantDatabase();
		var result = db.insert('ib_projects', insertObject);
		if(result.error) {
			Transaction.rollback();
			Transfer.toErrorPage({
				title: 'エラー',
				message: '登録処理時にエラーが発生しました。',
				detail: result.errorMessage
			});
		}
		var lastID = db.select("SELECT currval(pg_get_serial_sequence('ib_projects','id')) as last_insert_id");
		last_insert_id = lastID.data[0].last_insert_id;
		
		var modules = request.getParameterValues("enabled_module_names[]");
		for(var i=0; i<modules.length; i++){
			var insertModule =  {
				project_id: parseInt(last_insert_id),
				module_id:parseInt(modules[i])
			};
			var result = db.insert('ib_projects_modules', insertModule);
		}
		var trackers = request.getParameterValues("tracker_ids[]");
		for(var i=0; i<trackers.length; i++){
			var insertTracker =  {
				project_id: parseInt(last_insert_id),
				tracker_id:parseInt(trackers[i])
			};
			var result = db.insert('ib_projects_trackers', insertTracker);
		}
		if(request.parent_id!="" && request.is_inherit_members==1){
			var projectRoleArray = db.execute("SELECT user_cd, role_id FROM ib_projects_users_roles WHERE project_id=?",[DbParameter.number(parseInt(request.parent_id))]);
			for (var i = 0; i <projectRoleArray.data.length; i++) {
				//if(inArray(projectRoleArray.data[i].user_cd, resTrackers)){
				var insertRole =  {
					project_id: parseInt(last_insert_id),
					role_id:parseInt(projectRoleArray.data[i].role_id),
					user_cd: new String(projectRoleArray.data[i].user_cd),
					created_by: new String(userCd)
				};
				var result = db.insert('ib_projects_users_roles', insertRole);
			}
		}
	});
	
	Client.set('ib_projects/register' + '-status', {error : false, success : true, message: '', project_id: parseInt(last_insert_id), action_type: request.action_button});
}

/**
* Function to check identifier is existing on databse or not.
*/
	
function doIdentifier(request){
	var displayList= [];
	var db     = new TenantDatabase();
	var cntIdnt = db.execute("SELECT count(*) as count FROM ib_projects WHERE identifier = ?",[DbParameter.string(request.identifier)] );
	
	if(cntIdnt.data[0].count>0){
		displayList.push({
			code : 1
		});	
	}
	else {
		displayList.push({
			code : 0
		});	
	}
	var jsonString = ImJson.toJSONString (displayList);
	var response = Web.getHTTPResponse ();
	response.setContentType ("application / json; charset = UTF-8");
	response.sendMessageBodyString (jsonString);
}

/**
 * in array function to check value exist on a array
 * @param {value} value that search in array
 * @param {arrList} array where value search
 */
function inArray(value, arrList) {
	var length = arrList.length;
	for(var i = 0; i < length; i++) {
		if(arrList[i] == value) return true;
	}
	return false;
}