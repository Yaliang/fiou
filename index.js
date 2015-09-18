Parse.initialize("ZnLjW6xuqieYfVfFJZB5nuRONBybVGCjJTS0T8El", "rci8OKWaBeYZSaC6kAwLr30RhmmFFPUWrDCe1ZqG");

DataService = {
	getUserNameByUserId : function(userid, options) {
		options = options || {}
		var User = Parse.Object.extend("User")
		var query = new Parse.Query(User)
		query.get(userid, {
			success: function(userObj) {
				// The object was retrieved successfully.
				if (options.callback) {
					options.callback(userObj.getUsername())
				}
			},
			error: function(userObj, error) {
				// The object was not retrieved successfully.
				// error is a Parse.Error with an error code and message.
			}
		});
	}, 
	addConnectByUserId : function(userid, options) {
		options = options || {}
		var currentUser = Parse.User.current()
		var currentUserId = currentUser.id

		if (currentUserId == userid) {
			if (options.callback) {
				options.callback()
			}
			return
		}

		var Connection = Parse.Object.extend("Connection")
		var query = new Parse.Query(Connection)

		var User = Parse.Object.extend("User")
		var queryUserSelf = new Parse.Query(User)
		queryUserSelf.get(currentUserId)
		var queryUserTarget = new Parse.Query(User)
		queryUserTarget.get(userid)
		query.matchesQuery("owner", queryUserSelf)
		query.matchesQuery("target", queryUserTarget)
		query.find({
			success: function(connections) {
				if (connections.length == 0) {
					var Connection = Parse.Object.extend("Connection")
					var User = Parse.Object.extend("User")
					var connection = new Connection()
					var userSelf = new User()
					userSelf.id = currentUserId
					var userTarget = new User()
					userTarget.id = userid

					connection.set("owner", userSelf)
					connection.set("target", userTarget)

					connection.save(null, {
						success: function(connection) {
							if (options.callback) {
								options.callback(connection)
							}
						}
					})
				} else {
					if (options.callback) {
						options.callback()
					}
				}
			}
		})
	}
}

user = {
	id: "",
	username: "",
	autologin: function(options) {
		var currentUser = Parse.User.current()

		options = options || {}

		if (currentUser) {
			user.id = currentUser.id
			user.username = currentUser.getUsername()
			options.dest = options.dest || "home"
			if (options.dest != "@current") {
				pt.loadPage(options.dest)
			}
		} else {
			pt.loadPage("login")
		}
	},
	login: function() {
		var myname = $("#username").val()
		var mypass = $("#password").val()
		Parse.User.logIn(myname, mypass, {
			success: function(userObj) {
				$("#loginerror").html("")
				console.log(userObj)
				user.id = userObj.id
				user.username = userObj.getUsername()
				pt.loadPage("home")
			},
			error: function(error) {
				var loginerrormsg = "<div style='display:none' class='alert alert-warning alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>"+JSON.parse(JSON.stringify(error)).message+"</div>"
				$("#loginerror").html(loginerrormsg)
				$("#loginerror div:first-child").slideDown()
			}
		});
	},
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
	logout: function() {
		Parse.User.logOut()

		pt.loadPage("login")
	},
	acquireUserNameById : function(userid, options) {
		DataService.getUserNameByUserId(userid, options)
	},
	addConnect: function(userid, options) {
		DataService.addConnectByUserId(userid, options)
	}
}

ajaxloader = {
	get : function(id) {
		var href = "./"+id+".html"
		ajaxloader.done = false
		$.get(href, function(data) {
			ajaxloader.extract(data)
			ajaxloader.done = true
		})
	},
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
	callback : false
}