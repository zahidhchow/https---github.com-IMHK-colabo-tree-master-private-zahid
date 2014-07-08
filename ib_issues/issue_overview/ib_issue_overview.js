/** set display details */
var $form = {
	id : "",
	name : "",
	description : "",
	homepage : ""
}

/* description set */
var $descriptionSet = false;

/* homepage set */
var $homepagenSet = false;

/* set tracker list */
var $traclerList = '';

/* set user role list */
var $userRoleList = '';
/**
 * initialization function for the page on which the value is displayed
 * 
 * @param {Request} request Request object
 */
function init(request){
	var db = new TenantDatabase();
	//display basic details
	var findParams = {
						project_id: parseInt(Client.get('project_id_session_value'))
					}
	// Find tracker list from database
	var projectArray = db.execute("SELECT id, name, description, homepage FROM ib_projects WHERE id=?",[DbParameter.number(parseInt(Client.get('project_id_session_value')))]);
	$form = projectArray.data[0];
	if(!isBlank($form.description)) {	
		$descriptionSet = true;
	}
	if(!isBlank($form.homepage)) {
		$homepagenSet = true;
	}
	//find tracker wise open and close issue
	var issueOverviewResult = db.executeByTemplate('ib_issues/issue_overview/ib_issue_overview',findParams);
	for (var i = 0; i <issueOverviewResult.data.length; i++) {
		$traclerList += '<li><a href="ib_issues/issues?t='+issueOverviewResult.data[i].id+'">'+issueOverviewResult.data[i].name+'</a>: '+issueOverviewResult.data[i].n_tracker+' '+MessageManager.getMessage("OPEN.ID")+' / '+issueOverviewResult.data[i].n_open_tracker+' </li>';
	}
	
	//find member list with assigned role
	var memberOverviewResult = db.executeByTemplate('ib_issues/issue_overview/ib_member_overview',findParams);
	for (var i = 0; i <memberOverviewResult.data.length; i++) {
		$userRoleList += memberOverviewResult.data[i].name+': '+memberOverviewResult.data[i].user_name+'<br>';
	}
}