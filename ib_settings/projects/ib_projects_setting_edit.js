/**
 * 入力チェック定義オブジェクト。
 * @type Object
 */
var validateRule = {
	module_list:{caption : MessageManager.getMessage("ISSUE.TRACKING.ID"), required: true}
};

/** for displaying the trackers */
var $trackerList = '';

/** for displaying the modules */
var $moduleList = '';

/** for displaying the default public */
var $defaultProjectsPublic
/**
 * update message display
 */
var $status = {
	error   : false,
	success : false,
	message : ''
};

/**
 * initialization function for the page on which the value is displayed
 * 
 * @param {Request} request Request object
 */
function init(request){
	var db = new TenantDatabase();
	
	// Find setting from database	
	var settingArray = db.select("SELECT value FROM ib_settings WHERE name = 'default_projects_public'");
	if(settingArray.data[0].value=='1' ){
		$defaultProjectsPublic = true;
	}
	
	var moduleSettingArray = db.select("SELECT value FROM ib_settings WHERE name = 'default_projects_module_ids'");
	var resModules = moduleSettingArray.data[0].value.split(",");
	
	// Find tracker list from database
	var moduleArray = db.select("SELECT id, name FROM ib_modules ORDER BY created_on ASC");	
	
	for (var i = 0; i <moduleArray.data.length; i++) {
		if(inArray(moduleArray.data[i].id, resModules)){
			$moduleList += '<input type="checkbox" name="module_list[]" value="'+moduleArray.data[i].id+'" checked />&nbsp;'+moduleArray.data[i].name+'<br>';
		}
		else{
			$moduleList += '<input type="checkbox" name="module_list[]" value="'+moduleArray.data[i].id+'" />&nbsp;'+moduleArray.data[i].name+'<br>';
		}
	}
	
	// Find tracker list from database
	var trackerArray = db.select("SELECT id, name FROM ib_trackers ORDER BY position ASC");	
	
	// Find tracker setting value
	var trackerSettingArray = db.select("SELECT value FROM ib_settings WHERE name = 'default_projects_tracker_ids'");
	var resTrackers = trackerSettingArray.data[0].value.split(",");
	
	for (var i = 0; i <trackerArray.data.length; i++) {
		if(inArray(trackerArray.data[i].id, resTrackers)){
			$trackerList += '<input type="checkbox" name="tracker_list[]" value="'+trackerArray.data[i].id+'" checked />&nbsp;'+trackerArray.data[i].name+'<br>';
		}
		else{
			$trackerList += '<input type="checkbox" name="tracker_list[]" value="'+trackerArray.data[i].id+'" />&nbsp;'+trackerArray.data[i].name+'<br>';
		}
	}
	$status = Client.get('ib_settings/projects' + '-status');
	Client.remove('ib_settings/projects' + '-status');
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

/**
 * function for update project setting
 */
	
function doUpdate(request) {	
	var db = new TenantDatabase();
	
	//update default projects public
	if(request.default_projects_public==1){
		var editObjectDP =  {
			value : new String('1')
		};
	}
	else{
		var editObjectDP =  {
			value : new String('0')
		};
	}
	var result = db.update('ib_settings',
	editObjectDP,
	'name = ? ',
	[
		DbParameter.string('default_projects_public')
	]);	
	
	//module list for project setting
	var modules = request.getParameterValues("module_list[]");
	var module_join = modules.join(',');
	var editObjectTL =  {
		value : new String(module_join)
	};
	var result = db.update('ib_settings',
	editObjectTL,
	'name = ? ',
	[
		DbParameter.string('default_projects_module_ids')
	]);
	
	//tracker list for project setting
	var trackers = request.getParameterValues("tracker_list[]");
	var tracker_join = trackers.join(',');
	var editObjectTL =  {
		value : new String(tracker_join)
	};
	var result = db.update('ib_settings',
	editObjectTL,
	'name = ? ',
	[
		DbParameter.string('default_projects_tracker_ids')
	]);
	
	Client.set('ib_settings/projects' + '-status', {error : false, success : true, message: ''});
}