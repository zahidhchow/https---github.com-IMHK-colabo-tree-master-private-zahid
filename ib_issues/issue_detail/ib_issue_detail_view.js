/** set display details */
var $displayDetail = {
};

/** set display list */
var $displayDetailFiles = "";

/** set display chamge */
var $displayChangesHistory = "";

/**
* update message display
*/
var $status = {
	error   : false,
	success : false,
	message : ''
};

var validateRule = {

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
						issue_id: parseInt(request.issueid)
					}
	var issueResult = db.executeByTemplate('ib_issues/issue_detail/ib_issue_detail_view',findParams);
	if(issueResult.data.length>0){
		issueResult.data[0].added_time_difference = calDateDifference(new Date(),issueResult.data[0].created_on);
		issueResult.data[0].updated_time_difference = calDateDifference(new Date(),issueResult.data[0].updated_on);
		// Find issue time log
		var issueTimeLogArray = db.execute("SELECT hours FROM ib_time_entries WHERE issue_id = ?" ,[DbParameter.number(parseInt(request.issueid))]);
		var spent_time = 0;
		for (var i = 0; i <issueTimeLogArray.data.length; i++) {
			var issueHours = issueTimeLogArray.data[i].hours.split(":");
			spent_time += (parseInt(issueHours[0])*60) + parseInt(issueHours[1]);
		}
		issueResult.data[0].total_spent_time = parseInt(spent_time/60)+':'+(spent_time%60);
		$displayDetail = issueResult.data[0];
	}	
	
	// Find issue files
	var issueFilesArray = db.execute("SELECT i.*,u.user_name FROM ib_issues_files i INNER JOIN imm_user AS u ON u.user_cd = i.created_by WHERE i.issue_id = ? GROUP BY i.id,u.user_name",[DbParameter.number(parseInt(request.issueid))]);
	
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
		$displayDetailFiles+= '<span class="size">('+bytesToSize(sizeFile.length())+')</span><a title="'+MessageManager.getMessage("DELETE.ID")+'" rel="nofollow" onclick="return confirm(\''+MessageManager.getMessage("ARE.YOU.SURE.ID")+'\');" class="delete" href="ib_issues/details/file/'+issueFilesArray.data[i].id+'">';
		$displayDetailFiles+= '<img src="ui/images/delete.png" alt="'+MessageManager.getMessage("DELETE.ID")+'"></a><span class="author">'+issueFilesArray.data[i].user_name+', '+date_format+'</span></p>';
	}
	
	// To acquire the account context.
	var accountContext = Contexts.getAccountContext();
	// To acquire the user code.
	var userCd = accountContext.userCd;
	
	//Find the change history
	var issueChangeResult = db.execute("SELECT ic.*,u.user_name FROM ib_issues_changes ic INNER JOIN imm_user AS u ON u.user_cd = ic.updated_by WHERE issue_id = ?  GROUP BY ic.id,u.user_name ORDER BY ic.id ASC",[DbParameter.number(parseInt(request.issueid))]);
	for (var i = 0; i <issueChangeResult.data.length; i++) {
		$displayChangesHistory += '<div class="journal has-notes has-details" id="change-'+issueChangeResult.data[i].id+'">';
		$displayChangesHistory += '<div id="note-'+i+'">';
		$displayChangesHistory += '<h4 style="border-bottom: 1px dotted #bbbbbb;">';		
		$displayChangesHistory += MessageManager.getMessage("UPDATED.BY.ID")+' '+issueChangeResult.data[i].user_name+' '+calDateDifference(new Date(),issueChangeResult.data[i].updated_on)+' '+MessageManager.getMessage("AGO.ID")+'</h4>';
		if(issueChangeResult.data[i].is_description_change==1){
			$displayChangesHistory += '<ul class="details"><li><strong>'+MessageManager.getMessage("DESCRIPTION.ID")+'</strong> '+MessageManager.getMessage("UPDATED.ID")+' <a href="ib_issues/details/diff/'+issueChangeResult.data[i].id+'"> ('+MessageManager.getMessage("DIFF.ID")+')</a></li></ul>';
		}
		$displayChangesHistory += issueChangeResult.data[i].change_list;
		if(issueChangeResult.data[i].is_private==0 || issueChangeResult.data[i].updated_by==userCd){
			var notes_result = (isBlank(issueChangeResult.data[i].notes))?'':issueChangeResult.data[i].notes;
			$displayChangesHistory += '<div id="journal-'+issueChangeResult.data[i].id+'-notes" class="wiki editable"><p>'+notes_result+'</p></div>';
		}
		$displayChangesHistory += '</div>';
		$displayChangesHistory += '</div><br>';
	}
	
	$status = Client.get('ib_issues/details/delete/' + '-status');
	Client.remove('ib_issues/details/delete/' + '-status');
}

/**
 * calculate time difference
 *
 * @param {today} todat date; {past} previous date want to get diffrerence form;
 */
function calDateDifference(today, past) {
	var diff = Math.floor(today.getTime() - past.getTime());
	var minute = 1000* 60;
	
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
	secureRedirect('ib_issues/details/'+issueFileArray.data[0].issue_id, {});
}

/**
* Download file from storage location
* 
* @param request
*/

function doFileDownload(request) {
	var db = new TenantDatabase();
	var issueFileArray = db.execute("SELECT * FROM ib_issues_files WHERE id = ?",[DbParameter.number(parseInt(request.fileid))]);	
	var downloadFile = new PublicStorage('upload/'+issueFileArray.data[0].filename);
	if(!downloadFile.isFile()) {
		// When file does not exist exception handling is done.
		secureRedirect('ib_issues/details/'+issueFileArray.data[0].issue_id, {});
	}
	else {
		// Send the file to client.
		Module.download.send(downloadFile, downloadFile.getName(), "text/plain");
	}
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
}


/**
* Function to delete issue by authenticate user
* 
* @param request
*/
function doDelete(request) {
	// トランザクション開始
	Transaction.begin(function() {
	var db     = new TenantDatabase();
	var result = db.remove('ib_issues',
				'id = ? ',
				[
					DbParameter.number(parseInt(request.issueid))
				]);
	
	// エラー時ロールバック
	if(result.error) {
		Transaction.rollback();
		Transfer.toErrorPage({
			title: 'エラー',
			message: '削除処理時にエラーが発生しました。',
			detail: result.errorMessage
		});
	}
	});
	Client.set('ib_issues/details/delete/' + '-status', {error : false, success : true, message: ''});
	//secureRedirect('employee/reportauth/add', {employeeId:request.issueid});
}
