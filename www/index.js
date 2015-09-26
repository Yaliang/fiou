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
		var queryDirect1 = new Parse.Query(Connection)
		
		queryDirect1.equalTo("owner", currentUser)
		queryDirect1.equalTo("target", targetUser)

		var queryDirect2 = new Parse.Query(Connection)
		
		queryDirect2.equalTo("owner", targetUser)
		queryDirect2.equalTo("target", currentUser)

		var query = Parse.Query.or(queryDirect1, queryDirect2)
		/** check the current state between the current user and target user */
		query.find({
			success: function(connections) {
				if (connections.length == 0) {
					/** in the case that they are not connected */
					var connection = new Connection()

					connection.set("owner", currentUser)
					connection.set("target", targetUser)
					connection.set("isMain", true)
					connection.set("summary", 0)

					var acl = new Parse.ACL();
					acl.setPublicReadAccess(true);
					acl.setWriteAccess(currentUser.id, true);
					acl.setWriteAccess(targetUser.id, true);
					connection.setACL(acl)

					connection.save(null, {
						success: function(conObj) {
							var connectionBack = new Connection()
							connectionBack.set("owner", targetUser)
							connectionBack.set("target", currentUser)
							connectionBack.set("isMain", false)
							connectionBack.set("mainConnect", conObj)

							var aclBack = new Parse.ACL();
							aclBack.setPublicReadAccess(true);
							aclBack.setWriteAccess(currentUser.id, true);
							aclBack.setWriteAccess(targetUser.id, true);
							connectionBack.setACL(aclBack)

							connectionBack.save(null, {
								success: function(conObjBack) {
									options.setBothDirection = true
									options.connections = [conObj, conObjBack]
									if (options.callback) {
										options.callback(conObjBack, options)
									}
								}
							})
						}
					})
				} else if (connections.length == 1) {
					/** in this case they might been connected in one direction */
					if (connections[0].get("owner").id == currentUser.id) {
						/** in this case the direction from current user to target user has been set */
						if (options.callback) {
							options.callback(options)
						}
					} else {
						/** in this case, we build a new connection from current user to target user and point to the existing connection */
						var connection = new Connection()

						connection.set("owner", currentUser)
						connection.set("target", targetUser)
						connection.set("isMain", false)
						connection.set("mainConnect", connections[0])

						var acl = new Parse.ACL();
						acl.setPublicReadAccess(true);
						acl.setWriteAccess(currentUser.id, true);
						acl.setWriteAccess(targetUser.id, true);
						connection.setACL(acl)

						connection.save(null, {
							success: function(conObj) {
								if (options.callback) {
									options.callback(conObj, options)
								}
							}
						})
					}
				} else {
					/** both directions are connected */
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
		options = options || {}

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
	/**
	 * The function to create a new activity
	 * @param  {Object} data    The data to describe the Activity
	 * @param  {Object} options The options, which include callback or data for the callback are store here
	 * @return {[type]}         [description]
	 */
	createNewActivity: function(data, options) {
		options = options || {}

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
	/**
	 * The function to create a new record
	 * @param  {Object} data    The data to describe a Record
	 * @param  {Object} options The options, including the callback or other data for the callback
	 * @return {[type]}         [description]
	 */
	createNewRecordWithActivityId: function(data, options) {
		options = options || {}

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
	/**
	 * The function to connect record with activity
	 * @param {Object} data    The data to identify the activity
	 * @param {Object} options The options, including the callback and the potential data to utilize.
	 */
	addRecordIntoActivity: function(data, options) {
		options = options || {}

		var Activity = Parse.Object.extend("Activity")
		var query = new Parse.Query(Activity)

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
	},
	/**
	 * When some record is add to the server, we also update the summary between the payer and borrower
	 * The process can help to speed up when the user want to check the summary of records with other users
	 * @param  {Object} data    The data including the payer, borrower and amount
	 * @param  {Object} options The options, including the callback or the data for callback
	 * @return {[type]}         [description]
	 */
	updateSummaryInConnect: function(data, options) {
		console.log("start update")
		options = options || {}

		var Connection = Parse.Object.extend("Connection")
		var payer = data.payer
		var borrower = data.borrower

		var queryDirect1 = new Parse.Query(Connection)

		queryDirect1.equalTo("owner", payer)
		queryDirect1.equalTo("target", borrower)

		var queryDirect2 = new Parse.Query(Connection)

		queryDirect2.equalTo("owner", borrower)
		queryDirect2.equalTo("target", payer)

		var query = Parse.Query.or(queryDirect1, queryDirect2)

		query.find({
			success: function(connections) {
				for (var i = 0; i< connections.length; i++) {
					if (connections[i].get("isMain") == true) {
						/** now we find the main connection which is counting the summary */
						if (connections[i].get("owner").id == payer.id) {
							/** case: owner is the payer: increase amount directly */
							connections[i].increment("summary", data.amount)
							connections[i].save(null, {
								success: function(conObj) {
									if (options.callback) {
										options.callback(conObj, options)
									}
								}
							})
							break
						} else if (connections[i].get("owner").id == borrower.id) {
							/** case: owner is the borrower: decrease amount */
							connections[i].increment("summary", -1.0 * data.amount)
							connections[i].save(null, {
								success: function(conObj) {
									if (options.callback) {
										options.callback(conObj, options)
									}
								}
							})
							break
						}
					}
				}
			}
		})
	},
	getAllRecordWithUserID: function(data, options) {
		options = options || {}

		var Record = Parse.Object.extend("Record")

		var User = Parse.Object.extend("User")
		var queryUser = new User()
		queryUser.id = data.userid

		var queryUserInPayer = new Parse.Query(Record)
		queryUserInPayer.equalTo("payer", queryUser)

		var queryUserInBorrower = new Parse.Query(Record)
		queryUserInBorrower.equalTo("borrower", queryUser)

		var queryAll = Parse.Query.or(queryUserInPayer, queryUserInBorrower)

		queryAll.descending("createdAt")
		queryAll.limit(data.limit || 10)
		queryAll.skip(data.skip || 0)

		queryAll.find({
			success: function(records) {
				if (options.callback) {
					options.callback(records, options)
				}
			}
		})
	},
	getAllSummaryOfCurrentUser: function(options) {
		options = options || {}

		var Connection = Parse.Object.extend("Connection")
		var currentUser = Parse.User.current()

		var queryDirect1 = new Parse.Query(Connection)
		queryDirect1.equalTo("owner", currentUser)
		var queryDirect2 = new Parse.Query(Connection)
		queryDirect2.equalTo("target", currentUser)

		var query = Parse.Query.or(queryDirect1, queryDirect2)

		query.find({
			success: function(connections) {
				options.pending = {
					length: connections.length
				}
				options.done = {
					length: 0
				}
				for (var i=0; i< connections.length; i++) {
					if (connections[i].get("isMain") == true) {
						/** in the case, that the object we queried is the main object */
						var amount = connections[i].get("summary")
						var target = connections[i].get("target")
						if (connections[i].get("target").id == currentUser.id) {
							amount = -amount
							target = connections[i].get("owner")
						}
						var j = options.done.length
						options.done.length += 1
						options.done[j] = {
							originalConnection: connections[i],
							amount: amount,
							target: target
						}
					}
				}

				/** now all connection is processed */
				if (options.callback) {
					options.callback(options)
				}
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
		var href = "./pages/"+id+".html"
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