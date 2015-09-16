Parse.initialize("ZnLjW6xuqieYfVfFJZB5nuRONBybVGCjJTS0T8El", "rci8OKWaBeYZSaC6kAwLr30RhmmFFPUWrDCe1ZqG");

user = {
	autologin: function() {
		var currentUser = Parse.User.current()

		if (currentUser) {
			pt.loadPage("home")
		}
	},
	login: function() {
		var myname = $("#username").val()
		var mypass = $("#password").val()
		Parse.User.logIn(myname, mypass, {
			success: function(user) {
				$("#loginerror").html("")
				pt.loadPage("home")
			},
			error: function(error) {
				$("#loginerror").html(JSON.parse(JSON.stringify(error)).message)
			}
		});
	},
	signup: function() {
		var myname = $("#set-username").val()
		var mypass = $("#set-password").val()

		var user = new Parse.User()
		user.set("username", myname)
		user.set("password", mypass)
		user.set("email", myname)

		user.signUp(null, {
			success: function(user) {
				$("#signuperror").html("")
				pt.loadPage("home")
			},
			error: function(user, error) {
				console.log(error)
				$("#signuperror").html(JSON.parse(JSON.stringify(error)).message)
			}
		})
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
	}
}