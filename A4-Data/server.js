//Requires
const pug = require("pug");
const mongo = require('mongodb')
const express = require('express');
const session = require("express-session");
const MongoClient = mongo.MongoClient;
let db;

let app = express();
//Pug Templates
let renderHome = pug.compileFile("./public/views/pages/homepage.pug");
let renderRegister = pug.compileFile("./public/views/pages/register.pug");
let renderProfile = pug.compileFile("./public/views/pages/profile.pug");
let renderLogin = pug.compileFile("./public/views/pages/login.pug");
let renderUsers = pug.compileFile("./public/views/pages/users.pug");
let renderOrderForm = pug.compileFile("./public/views/pages/orderform.pug");
let renderOrder = pug.compileFile("./public/views/pages/order.pug")
//Delivery fees for restaurants
let delFees = {0:5,1:3.99,2:6}

app.use(session({
	secret:"some secret here",
	saveUninitialized:false,
	resave:false
	}))

app.set("view engine", "pug");
app.use(express.static("public"))
app.use(express.static("public/js"))
app.use(express.json())
//CSS
app.get("/.css/", function(req,res,next){
  res.setHeader("Content-Type", "text/css");
  res.sendFile(req.url, function(err){
	  if(err){
		  res.status(400).send("Could not get CSS file.")
		  return
	  }
	  res.status(200).send("CSS File sent.")
  })}
  );
//JS
app.get(/.js/, function(req,res){
	var filename = req.url;
	res.sendFile(filename,function(err){
		if(err){
		  res.status(400).send("Could not get JS file.");
		  return
		}
		res.status(200).send("JS file sent");
	  });
})

//Pages
//Home Page 
app.get("/", function(req, res){
  res.status(200).send(renderHome({loggedIn:req.session.loggedIn, id:req.session.id_}))
});
app.get("/login", function(req, res){
	res.status(200).send(renderLogin())
})
app.get("/registration", function(req,res){
	res.status(200).send(renderRegister());
})
app.get("/logout", function(req,res){
	req.session.destroy()
	delete res.locals.session;
	res.redirect("/");
})
app.get("/users", function(req, res){
	db.collection('users').find({privacy:false}).toArray(function(err, result){
		if(result != null){
			if(Object.keys(req.query) == 0){
				res.status(200).send(renderUsers({users:result, id:req.session.id_, loggedIn:req.session.loggedIn}))
			}else{
				let arr = []
				for(let i = 0; i < result.length; i++){
					if(result[i].username.toLowerCase().indexOf(req.query.username.toLowerCase()) != -1){
						arr.push(result[i])
					}
				}
				res.status(200).send(renderUsers({users:arr, id:req.session.id_, loggedIn:req.session.loggedIn}))
			}
		}
	})
})
//Order Form for placing orders
app.get("/order",function(req, res){
	res.status(200).send(renderOrderForm({id:req.session.id_, loggedIn:req.session.loggedIn}))
})
//User profile page
app.get("/users/:userID", function(req,res){
	let searchid;
	try{
		searchid = new mongo.ObjectId(req.params.userID);
	}catch{
		res.status(404).send("Unknown ID.");
		return;
	}
	db.collection('users').findOne({_id:searchid}, function(err, result){
		if(result == null){
			res.status(404).send();
			res.end();
		}
		else if(result.privacy == true && (req.session.loggedIn == false || req.session.id_ != result._id)){
			res.status(403).send();
			res.end();
		}else{
			let myOwnProfile = req.session.id_ == result._id
			db.collection('orders').find({userID:searchid.toString()}).toArray(function(err,data){
				console.log(data.length);
				res.status(200).send(renderProfile({orderdata:data,userdata:result,myOwnProfile:myOwnProfile, loggedIn:req.session.loggedIn, id:req.session.id_}))
			})
		}
	})
})
//Log in requests
app.post("/login", function(req, res){
	db.collection('users').findOne({username:req.body.username},function(err,result){
		//Check if user exists in db
		if(result != null){
			//If password matches existing user profile
			if(result.password == req.body.password){
				req.session.loggedIn = true;
				req.session.id_ = result._id;
				res.status(200).send("/");
				res.end();
			}else{
				res.status(401).send("That password is incorrect");
			}
		}else{
			res.status(401).send("That user does not exist.");
		}
	})
})
//Registration page
app.post("/registration", function(req,res){
	let u = {};
	u.username = req.body.username;
	u.password = req.body.password;
	u.privacy = false;
	//Find any users that have same name, if we find something, the current user can't use this name.
	db.collection('users').findOne(
		{username:u.username}, function(err, result){
			if(err) throw err;
			if(result == null){
				db.collection("users").insertOne(u);
				db.collection('users').findOne({username:u.username},function(err,result){
					req.session.loggedIn = true;
					req.session.id_ = result._id;
					res.status(200).send("users/" + result._id);
					res.end();
				})
			}else{
				res.status(401).send("Error.")
				res.end();
			}
	})
})
//Response to changing privacy value
app.put("/privacy", function(req, res){
	db.collection('users').findOne({_id:new mongo.ObjectId(req.session.id_)},function(err, result){
		let change;
		if(result.privacy == true){change = false;}else change = true;
		db.collection('users').updateOne({_id:new mongo.ObjectId(req.session.id_)}, {$set:{privacy:change}})
		res.status(200).send("/users/" + req.session.id_)
	})
})
//"Order" collection operations
app.post("/orders", function(req, res){
	let  u = {}
	
	u.restaurantID = req.body.restaurantID;
	u.restaurantName = req.body.restaurantName;
	u.subtotal = req.body.subtotal;
	u.total = req.body.total;
	u.fee = req.body.fee;
	u.tax = req.body.tax;
	u.order = req.body.order;
	u.userID = req.session.id_;
	db.collection("orders").insertOne(u);
	res.status(200).send();
})
//Viewing specific orders made by users
app.get("/orders/:orderID", function(req, res){
	let searchid;
	try{
		searchid = new mongo.ObjectId(req.params.orderID);
	}catch{
		res.status(404).send("Unknown ID.");
		return;
	}
	//First, we get the order using the ID in the parameters.
	db.collection('orders').findOne({_id:searchid}, function(err, result){
		if(result == null){
			res.status(404).send();
			res.end();
		}
		else if(result.privacy == true && (req.session.loggedIn == false || req.session.id_ != result._id)){
			res.status(403).send();
			res.end();
		}else{
			let usersearchid;
			try{
				usersearchid = new mongo.ObjectId(result.userID);
			}catch{
				res.status(404).send("Unknown ID.");
				return;
			}
			//Find the user who placed this order.
			db.collection('users').findOne({_id:usersearchid}, function(err,userinfo){
				res.status(200).send(renderOrder({delfee:delFees[result.restaurantName],data:result,loggedIn:req.session.loggedIn, id:req.session.id_, userinfo:userinfo}))
			})
		}
	})
})
//Start server and database
MongoClient.connect("mongodb://localhost:27017/", function(err, client) {
  if(err) throw err;

  //Get the a4 database
  db = client.db('a4');

  app.listen(3000);
  console.log("Listening on port 3000");
});
