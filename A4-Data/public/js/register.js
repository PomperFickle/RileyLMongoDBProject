let userNField = document.getElementById("username")
let passwordField = document.getElementById("password")

function registerUser(){
    if(userNField.value == "" || passwordField == ""){
        alert("Enter values for both fields please.");
        return
    }
    let xhttp = new XMLHttpRequest();
    let params = {username:userNField.value, password:passwordField.value}
    xhttp.onreadystatechange = function(){
        if(this.readyState==4 && this.status ==200){
            window.location.href = this.response;
        }
        if(this.readyState == 4 && this.status == 401){
            alert("Username already exists, please choose another");
        }
    };xhttp.open('POST', "/registration");
    xhttp.setRequestHeader("Content-type", "application/json")
    xhttp.send(JSON.stringify(params));
}
