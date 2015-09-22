Parse.initialize("ZnLjW6xuqieYfVfFJZB5nuRONBybVGCjJTS0T8El", "rci8OKWaBeYZSaC6kAwLr30RhmmFFPUWrDCe1ZqG");

DataService = {
	/**
	 * parse the user's name/ user object by the specific user id
	 * @param  {String} userid  The id of user object
	 * @param  {Object} options Options
	 * @return {[type]}         [description]
	 */
	getUserNameByUserId : function(userid, options) {
		options = options || {}
		var User = Parse.Object.extend("User")
		var query = new Parse.Query(User)
		query.get(userid, {
			success: function(userObj) {
				// The object was retrieved successfully.
				if (options.callback) {
					options.callback(userObj.getUsername(), userObj, options)
				}
			},
			error: function(userObj, error) {
				// The object was not retrieved successfully.
				// error is a Parse.Error with an error code and message.
			}
		});
	}, 
	/**
	 * add connection between current user and a user with specific id
	 * @param {String} userid  The id of user object
	 * @param {Object} options Options
	 */
	addConnectByUserId : function(userid, options) {
		options = options || {}
		var User = Parse.Object.extend("User")
		var currentUser = Parse.User.current()
		var targetUser = new User()
		targetUser.id = userid

		/** check if the current user is same with the user we want to connect */
		if (currentUser.id == userid) {
			if (options.callback) {
				options.callback(options)
			}
			return
		}

		var Connection = Parse.Object.extend("Connection")
		var query = new Parse.Query(Connection)

		
		query.equalTo("owner", currentUser)
		query.equalTo("target", targetUser)
		/** check the current state between the current user and target user */
		query.find({
			success: function(connections) {
				if (connections.length == 0) {
					/** in the case that they are not connected */
					var connection = new Connection()

					connection.set("owner", currentUser)
					connection.set("target", targetUser)

					connection.save(null, {
						success: function(conObj) {
							if (options.callback) {
								options.callback(conObj, options)
							}
						}
					})
				} else {
					if (options.callback) {
						options.callback(options)
					}
				}
			}
		})
	},
	/**
	 * fetch all connections of current user
	 * @param  {Object} options The options
	 * @return {[type]}         [description]
	 */
	getConnectionOfCurrentUser: function(options) {
		var currentUser = Parse.User.current()

		var Connection = Parse.Object.extend("Connection")
		var query = new Parse.Query(Connection)
		query.equalTo("owner", currentUser)

		query.find({
			success: function(connections) {
				if (options.callback) {
					options.callback(connections, options)
				}
			}
		})
	},
	createNewActivity: function(data, options) {
		var description = data.description
		var currentUser = Parse.User.current()
		var records = []
		var Activity = Parse.Object.extend("Activity")

		var activ = new Activity()
		activ.set("createdByWho", currentUser)
		activ.set("description", description)
		activ.set("records", records)

		var acl = new Parse.ACL();
		acl.setPublicReadAccess(true);
		acl.setWriteAccess(currentUser.id, true);
		activ.setACL(acl)

		activ.save(null, {
			success: function(activObj) {
				if (options.callback) {
					options.callback(activObj, options)
				}
			}
		})
	},
	createNewRecordWithActivityId: function(data, options) {
		var User = Parse.Object.extend("User")
		var payer = new User()
		payer.id = data.payer
		var borrower = new User()
		borrower.id = data.borrower
		var amount = data.amount
		var Activity = Parse.Object.extend("Activity")
		var activ = new Activity()
		activ.id = data.activ
		var currentUser = Parse.User.current()

		var Record = Parse.Object.extend("Record")
		var rec = new Record()

		rec.set("payer", payer)
		rec.set("borrower", borrower)
		rec.set("amount", amount)
		rec.set("inWhichActivity", activ)

		var acl = new Parse.ACL()
		acl.setPublicReadAccess(true)
		acl.setWriteAccess(currentUser.id, true)
		rec.setACL(acl)

		rec.save(null, {
			success: function(recordObj) {
				if (options.callback) {
					options.callback(recordObj, options)
				}
			}
		})
	},
	addRecordIntoActivity: function(data, options) {
		var Activity = Parse.Object.extend("Activity")
		var query = new Parse.Query(Activity)
		console.log(data.activ)

		query.get(data.activ, {
			success: function(activObj) {
				activObj.addUnique("records", data.record)
				activObj.save(null, {
					success: function(activObj) {
						if (options.callback) {
							options.callback(activObj, options)
						}
					}
				})
			}
		})
	}
}

user = {
	id: "",
	username: "",
	/**
	 * function to auto login by the cache's token in localStorage
	 * @param  {Object} options Options
	 * @return {[type]}         [description]
	 */
	autologin: function(options) {
		var currentUser = Parse.User.current()

		options = options || {}

		if (currentUser) {
			user.id = currentUser.id
			user.username = currentUser.getUsername()
			options.dest = options.dest || "home"
			if (options.dest != "@current") {
				ajaxloader.callback = function() {
					if (pt.pageStack.indexOf("login") > -1) {
						pt.pageStack.splice(pt.pageStack.indexOf("login"), 1)
					}
					if ($("#login").length > 0) {
						$("#login").remove()
					}
					if (typeof pt.prevElement != "undefined" && pt.prevElement.attr("id") == "login") {
						pt.prevElement = $("#"+pt.prevPage())
					}
					if (pt.pageStack.indexOf("signup") > -1) {
						pt.pageStack.splice(pt.pageStack.indexOf("signup"), 1)
					}
					if ($("#signup").length > 0) {
						$("#signup").remove()
					}
					if (typeof pt.prevElement != "undefined" && pt.prevElement.attr("id") == "signup") {
						pt.prevElement = $("#"+pt.prevPage())
					}
					ajaxloader.callback = false
				}
				pt.loadPage(options.dest)
			}
		} else {
			pt.loadPage("login")
		}
	},
	/**
	 * login function 
	 * @return {[type]} [description]
	 */
	login: function() {
		var myname = $("#username").val()
		var mypass = $("#password").val()
		Parse.User.logIn(myname, mypass, {
			success: function(userObj) {
				$("#loginerror").html("")
				console.log(userObj)
				user.id = userObj.id
				user.username = userObj.getUsername()
				ajaxloader.callback = function() {
					if (pt.pageStack.indexOf("login") > -1) {
						pt.pageStack.splice(pt.pageStack.indexOf("login"), 1)
					}
					if ($("#login").length > 0) {
						$("#login").remove()
					}
					if (typeof pt.prevElement != "undefined" && pt.prevElement.attr("id") == "login") {
						pt.prevElement = $("#"+pt.prevPage())
					}
					if (pt.pageStack.indexOf("signup") > -1) {
						pt.pageStack.splice(pt.pageStack.indexOf("signup"), 1)
					}
					if ($("#signup").length > 0) {
						$("#signup").remove()
					}
					if (typeof pt.prevElement != "undefined" && pt.prevElement.attr("id") == "signup") {
						pt.prevElement = $("#"+pt.prevPage())
					}
					ajaxloader.callback = false
				}
				pt.loadPage("home")
			},
			error: function(error) {
				var loginerrormsg = "<div style='display:none' class='alert alert-warning alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>"+JSON.parse(JSON.stringify(error)).message+"</div>"
				$("#loginerror").html(loginerrormsg)
				$("#loginerror div:first-child").slideDown()
			}
		});
	},
	/**
	 * sign up function
	 * @return {[type]} [description]
	 */
	signup: function() {
		var myname = $("#signup-username").val()
		var mypass = $("#signup-password").val()

		var myuser = new Parse.User()
		myuser.set("username", myname)
		myuser.set("password", mypass)

		myuser.signUp(null, {
			success: function(userObj) {
				$("#signuperror").html("")
				console.log(userObj)
				user.id = userObj.id
				user.username = userObj.getUsername()
				ajaxloader.callback = function() {
					if (pt.pageStack.indexOf("signup") > -1) {
						pt.pageStack.splice(pt.pageStack.indexOf("signup"), 1)
					}
					if ($("#signup").length > 0) {
						$("#signup").remove()
					}
					if (pt.prevElement.attr("id") == "signup") {
						pt.prevElement = $("#"+pt.prevPage())
					}

					if (pt.pageStack.indexOf("login") > -1) {
						pt.pageStack.splice(pt.pageStack.indexOf("login"), 1)
					}
					if ($("#login").length > 0) {
						$("#login").remove()
					}
					if (pt.prevElement.attr("id") == "login") {
						pt.prevElement = $("#"+pt.prevPage())
					}
					
					ajaxloader.callback = false
				}
				pt.loadPage("home")
			},
			error: function(userObj, error) {
				console.log(error)
				var signuperrormsg = "<div style='display:none' class='alert alert-warning alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>"+JSON.parse(JSON.stringify(error)).message+"</div>"
				$("#signuperror").html(signuperrormsg)
				$("#signuperror div:first-child").slideDown()

			}
		})
	},
	/**
	 * logout function
	 * @return {[type]} [description]
	 */
	logout: function() {
		Parse.User.logOut()

		pt.loadPage("login")
	},
	/**
	 * acquire the user's name / user object by the id of user object
	 * @param  {String} userid  The id of user object
	 * @param  {Object} options Options
	 * @return {[type]}         [description]
	 */
	acquireUserNameById : function(userid, options) {
		DataService.getUserNameByUserId(userid, options)
	},
	/**
	 * function to add a connection between current user and target user
	 * @param {String} userid  The id of target user
	 * @param {[type]} options [description]
	 */
	addConnect: function(userid, options) {
		DataService.addConnectByUserId(userid, options)
	},
	getConnection: function(options) {
		DataService.getConnectionOfCurrentUser(options)
	}
}

ajaxloader = {
	callback: false,
	/**
	 * the entry to request a get function
	 * @param  {String} id The id of file, it normally comes with the form "./<id>.html"
	 * @return {[type]}    [description]
	 */
	get : function(id) {
		var href = "./"+id+".html"
		ajaxloader.done = false
		$.get(href, function(data) {
			ajaxloader.extract(data)
			ajaxloader.done = true
		})
	},
	/**
	 * the function to extract the packaged file
	 * @param  {String} data The content of the file
	 * @return {Object}      The unpackaged object
	 */
	extract : function(data) {

		var obj = {}

		var pageid = data.substring(data.indexOf("<pageid>") + 8, data.indexOf("</pageid>"))
		if (pageid != null) {
			obj.pageid = pageid
			obj.pageId = pageid
		} else {
			obj.pageid = ""
			obj.pageId = ""
		}

		var title = data.substring(data.indexOf("<title>") + 7, data.indexOf("</title>"))
		if (title != null) {
			obj.title = title
		} else {
			obj.title = ""
		}

		var header = data.substring(data.indexOf("<header>") + 8, data.indexOf("</header>"))
		if (header != null) {
			obj.header = header
		} else {
			obj.header = ""
		}

		var main = data.substring(data.indexOf("<main>") + 6, data.indexOf("</main>"))
		if (main != null) {
			obj.main = main
			obj.content = main
		} else {
			obj.main = ""
			obj.content = ""
		}

		obj.contentAttr = {}
		var contentAttrOverscroll = data.substring(data.indexOf("<contentAttrOverscroll>") + 23, data.indexOf("</contentAttrOverscroll>"))
		if (contentAttrOverscroll != null) {
			obj.contentAttr.overscroll = contentAttrOverscroll == "true"
		}

		var footer = data.substring(data.indexOf("<footer>") + 8, data.indexOf("</footer>"))
		if (footer != null) {
			obj.footer = footer
		} else {
			obj.footer = ""
		}


		this.obj = obj

		return obj
	},
}