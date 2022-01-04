let privButton = document.getElementById("privButton")

function changePrivacy(){
    req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if(this.readyState==4 && this.status==200){
            alert("Privacy setting changed.")
            window.location.href = this.response;
		}
	}
					
	req.open("PUT", "/privacy");
	req.send();
}