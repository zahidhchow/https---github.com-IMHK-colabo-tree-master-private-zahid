/**
 * 入力チェック定義オブジェクト。
 * @type Object
 */
var validateRule = {
	emission_email_address:{caption : MessageManager.getMessage("EMISSION.EMAIL.ADDRESS.ID"), required: true, email: true}
};

/** for data for form */
var $form = {
	is_bcc_recipients: false,
	email_text: false,
	issue_added: false,
	issue_updated: false,
	time_tracking_updated: false
};

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
	var settingArray = db.select("SELECT name, value FROM ib_settings");
	for (var i = 0; i <settingArray.data.length; i++) {
		if(settingArray.data[i].name=='emission_email_address'){
			$form.emission_email_address = settingArray.data[i].value;
		}
		else if(settingArray.data[i].name=='is_bcc_recipients' && settingArray.data[i].value=='1'){
			$form.is_bcc_recipients = true;
		}
		else if(settingArray.data[i].name=='email_text' && settingArray.data[i].value=='1'){
			$form.email_text = true;
		}
		else if(settingArray.data[i].name=='issue_added' && settingArray.data[i].value=='1'){
			$form.issue_added = true;
		}
		else if(settingArray.data[i].name=='issue_updated' && settingArray.data[i].value=='1'){
			$form.issue_updated = true;
		}
		else if(settingArray.data[i].name=='time_tracking_updated' && settingArray.data[i].value=='1'){
			$form.time_tracking_updated = true;
		}
		else if(settingArray.data[i].name=='email_header'){
			$form.email_header = settingArray.data[i].value;
		}
		else if(settingArray.data[i].name=='email_footer'){
			$form.email_footer = settingArray.data[i].value;
		}
	}
	
	$status = Client.get('ib_settings/projects' + '-status');
	Client.remove('ib_settings/projects' + '-status');
}

/**
 * function for update project setting
 */
	
function doUpdate(request) {	
	var db = new TenantDatabase();
	
	//update emission email address
	var editObjectEEA =  {
		value : request.emission_email_address
	};
	var result = db.update('ib_settings',
	editObjectEEA,
	'name = ? ',
	[
		DbParameter.string('emission_email_address')
	]);	
	
	//update bcc recipients
	if(request.is_bcc_recipients==1){
		var editObjectBCC=  {
			value : new String('1')
		};
	}
	else{
		var editObjectBCC =  {
			value : new String('0')
		};
	}
	var result = db.update('ib_settings',
	editObjectBCC,
	'name = ? ',
	[
		DbParameter.string('is_bcc_recipients')
	]);
	
	//update email text
	if(request.email_text==1){
		var editObjectET =  {
			value : new String('1')
		};
	}
	else{
		var editObjectET =  {
			value : new String('2')
		};
	}
	var result = db.update('ib_settings',
	editObjectET,
	'name = ? ',
	[
		DbParameter.string('email_text')
	]);
	
	//update issue added
	if(request.issue_added==1){
		var editObjectIA =  {
			value : new String('1')
		};
	}
	else{
		var editObjectIA =  {
			value : new String('0')
		};
	}
	var result = db.update('ib_settings',
	editObjectIA,
	'name = ? ',
	[
		DbParameter.string('issue_added')
	]);
	
	//update issue updated
	if(request.issue_updated==1){
		var editObjectIU =  {
			value : new String('1')
		};
	}
	else{
		var editObjectIU =  {
			value : new String('0')
		};
	}
	var result = db.update('ib_settings',
	editObjectIU,
	'name = ? ',
	[
		DbParameter.string('issue_updated')
	]);
	
	//update time tracking updated
	if(request.time_tracking_updated==1){
		var editObjectTTU =  {
			value : new String('1')
		};
	}
	else{
		var editObjectTTU =  {
			value : new String('0')
		};
	}
	var result = db.update('ib_settings',
	editObjectTTU,
	'name = ? ',
	[
		DbParameter.string('time_tracking_updated')
	]);
	
	//update email header
	var editObjectEH =  {
		value : request.email_header
	};
	var result = db.update('ib_settings',
	editObjectEH,
	'name = ? ',
	[
		DbParameter.string('email_header')
	]);
	
	//update email footer
	var editObjectEF =  {
		value : request.email_footer
	};
	var result = db.update('ib_settings',
	editObjectEF,
	'name = ? ',
	[
		DbParameter.string('email_footer')
	]);
	
	Client.set('ib_settings/projects' + '-status', {error : false, success : true, message: ''});
}