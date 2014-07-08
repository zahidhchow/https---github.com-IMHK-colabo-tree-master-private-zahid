/** set display details */
var $form = {
	new_description : "",
	old_description : "",
	tracker_name : "",
	issue_id : "",
	updated_ago : ""
}

/**
 * initialization function for the page on which the value is displayed
 * 
 * @param {Request} request Request object
 */
function init(request){
	var db = new TenantDatabase();
	//display basic details
	var findParams = {
						diff_id: parseInt(request.diffid)
					}
	var diffResult = db.executeByTemplate('ib_issues/issue_detail/ib_issue_detail_diff',findParams);
	$form.new_description = diffResult.data[0].new_description;
	$form.old_description = diffResult.data[0].old_description;
	$form.tracker_name = diffResult.data[0].tracker;
	$form.issue_id = diffResult.data[0].id;
	$form.updated_ago = '<h4>'+MessageManager.getMessage("UPDATED.BY.ID")+' '+diffResult.data[0].user_name+' '+calDateDifference(new Date(),diffResult.data[0].updated_on)+' '+MessageManager.getMessage("AGO.ID")+'</h4>';;
}

/**
 * calculate time difference
 *
 * @param {today} todat date; {past} previous date want to get diffrerence form;
 */
function calDateDifference(today, past) {
	var diff = Math.floor(today.getTime() - past.getTime());
	var minute = 1000*60;
	
	var minutes = Math.floor(diff/minute);
	var hours = Math.floor(minutes/60);
	var days = Math.floor(hours/24);
	var months = Math.floor(days/30);
	var years = Math.floor(months/12);
	
	if(years > 0){
		return (years==1)?years +" "+ MessageManager.getMessage("YEAR.DETAIL.ID"):years +" "+MessageManager.getMessage("YEARS.DETAIL.ID");
	}
	if(months > 0){
		return (months==1)?months +" "+ MessageManager.getMessage("MONTH.DETAIL.ID"):months +" "+MessageManager.getMessage("MONTHS.DETAIL.ID");
	}
	if(days > 0){
		return (days==1)?days +" "+ MessageManager.getMessage("DAY.DETAIL.ID"):days +" "+MessageManager.getMessage("DAYS.DETAIL.ID");
	}
	if(hours > 0){
		return (hours==1)?hours +" "+ MessageManager.getMessage("HOUR.DETAIL.ID"):hours +" "+MessageManager.getMessage("HOURS.DETAIL.ID");
	}
	if(minutes==0){
		return MessageManager.getMessage("LESS.THAN.ID")+' '+ MessageManager.getMessage("A.ID")+' '+MessageManager.getMessage("MINUTE.DETAIL.ID");
	}
	return (minutes==1)?minutes +" "+ MessageManager.getMessage("MINUTE.DETAIL.ID"):minutes +" "+MessageManager.getMessage("MINUTES.DETAIL.ID");
}