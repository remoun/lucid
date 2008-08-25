dojo.provide("api.filesystem");
dojo.require("dojo.io.iframe");
api.filesystem = { 
	//	summary:
	//		A server-side virtual filesystem
	/*=====
	_fileInfo: {
		//	name: String
		//		the name of the file
		name: "",
		//	type: String
		//		the mimetype of the file ("text/directory" for directories)
		type: "text/plain",
		//	size: Int
		//		the size of the file (in bytes)
		size: 0,
		//	modified: String
		//		a timestamp of when the file was last modified
		modified: "F d Y H:i:s."
	},
	=====*/
	listDirectory: function(/*String*/path, /*Function?*/onComplete, /*Function?*/onError)
    {
		//	summary:
		//		Lists the files/folders of a given path
		//	path:
		//		the path to list
		//	onComplete:
		//		a callback function to fire on completion. The first argument passed is an array of api.filesystem._fileInfo objects
		//	onError:
		//		a callback function to fire on error
        var df =  api.xhr({
	        backend: "api.fs.io.getFolder",
		content: {
			path: path
		},
		handleAs: "json"
	});
	
	if(onComplete) df.addCallback(onComplete);
	if(onError) df.addErrback(onError);
	
	return df;
    },
	readFileContents: function(/*String*/path, /*Function?*/onComplete, /*Function?*/onError)
    {
		//	summary:
		//		Reads a file's contents
		//	path:
		//		the path to the file to be read
		//	onComplete:
		//		a callback function to fire on completion. The first argument is the contents of the file
		//	onError:
		//		a callback function to fire on error
	var df = new dojo.Deferred();
        var xhr = api.xhr({
	        backend: "api.fs.io.getFile",
		content: {
			path: path
		},
		handleAs: "json",
		load: function(data, ioArgs) {
			df.callback(data.contents);	
		},
		error: function(e) {
			df.errback(e);
		}
	});
	
	df.canceler = dojo.hitch(xhr, "cancel");
	
	if(onComplete) df.addCallback(onComplete);
	if(onError) df.addErrback(onError);
	
	return df;
    },
   writeFileContents: function(/*String*/path, /*String*/content, /*Function?*/onComplete, /*Function?*/onError)
   {
   		//	summary:
		//		Writes data to a file
		//	path:
		//		the path to the file
		//	content:
		//		the content to write to the file
		//	onComplete:
		//		a callback once the saving is complete.
		//	onError:
		//		a callback function to fire on error
		var df = new dojo.Deferred();
		var xhr=api.xhr({
				backend: "api.fs.io.writeFile",
				content: {
					path: path,
					content: content
				},
				load: function(data, ioArgs)
				{
					df[data=="0" ? "callback":"errback"]();
					var p = path.lastIndexOf("/");
					dojo.publish("filearea:"+path.substring(0, p+1), []);
				},
				error: function(e) {
					df.errback(e);
				}
	        });
		df.canceler = dojo.hitch(xhr, "cancel");
		if(onComplete) df.addCallback(onComplete);
		if(onError) df.addErrback(onError);
		df.addCallback(function() {
			dojo.publish("fsSizeChange", [path]);
		})
		return df;
    },
    move: function(/*String*/from, /*String*/to, /*Function?*/onComplete, /*Function?*/onError)
    {
		//	summary:
		//		moves or renames a file
		//	from:
		//		the source file
		//	to:
		//		the new filename or path. If only a filename is specified, the file will stay in it's source's directory
		//	onComplete:
		//		callback function to be fired upon completion
		//	onError:
		//		callback function to be fired upon error
		if(to.indexOf("/") == -1) {
			var i = from.lastIndexOf("/");
			var newpath = from.substring(0, i);
			newpath += "/" + to;
		} else {
			var newpath = to;
		}
		var df = new dojo.Deferred();
        var xhr = api.xhr({
	        backend: "api.fs.io.renameFile",
			content: {
				path: from,
				newpath: newpath
			},
			load: function(data, ioArgs)
			{
				df[data=="0" ? "callback":"errback"]();
			},
	        error: function(e) {
				df.errback(e);
			}
        });
		df.canceler = dojo.hitch(xhr, "cancel");
		if(onComplete) df.addCallback(onComplete);
		if(onError) df.addErrback(onError);
		
		return df;
    },
    createDirectory: function(/*String*/path, /*Function?*/onComplete, /*Function?*/onError)
    {
		//	summary:
		//		Creates a directory
		//	path:
		//		the path of the new directory to create
		//	onComplete:
		//		A callback function once the operation is completed. First param is true if successful, false if it failed.
		//	onError:
		//		A callback to be fired on error
		var df = new dojo.Deferred();
        var xhr = api.xhr({
	        backend: "api.fs.io.createDirectory",
			content: {
				path: path
			},
			load: function(data, ioArgs)
			{
				df[data=="0" ? "callback":"errback"]();
			},
		        error: function(e) {
				df.errback(e);
			}
        });
		df.canceler = dojo.hitch(xhr, "cancel");
		if(onComplete) df.addCallback(onComplete);
		if(onError) df.addErrback(onError);
		
		return df;
    },
    remove: function(/*String*/path, /*Function?*/onComplete, /*Function?*/onError)
    {
		//	summary:
		//		removes a file or directory
		//	path:
		//		the path to the file or directory
		//	onComplete:
		//		a callback function to be fired on completion. First param is true if successful, false if failed
		//	onError:
		//		a callback function to be fired on error
		var df = new dojo.Deferred();
        var xhr = api.xhr({
	        backend: "api.fs.io.removeFile",
			content: {
				path: path
			},
			load: function(data, ioArgs) {
				df[data=="0" ? "callback":"errback"]();
			},
	        error: function(e) {
				df.errback(e);
			}
        });
		df.canceler = dojo.hitch(xhr, "cancel");
		if(onComplete) df.addCallback(onComplete);
		if(onError) df.addErrback(onError);
		df.addCallback(function() {
			dojo.publish("fsSizeChange", [path]);
		})
		return df;
    },
    copy: function(/*String*/from, /*String*/to, /*Function?*/onComplete, /*Function?*/onError)
    {
		//	summary:
		//		Copies a file
		//	from:
		//		the path to the original file
		//	to:
		//		the path to the new copy of the file
		//	onComplete:
		//		a callback function once the task is done. First param is true if successful, false if it failed.
		//	onError:
		//		a callback function to be fired on error
		var df = new dojo.Deferred();
        var xhr = api.xhr({
	        backend: "api.fs.io.copyFile",
			content: {
				path: from,
				newpath: to
			},
			load: function(data, ioArgs) {
				df[data=="0" ? "callback":"errback"]();
			},
	        error: function(e) {
				df.errback(e);
			}
        });
		df.canceler = dojo.hitch(xhr, "cancel");
		if(onComplete) df.addCallback(onComplete);
		if(onError) df.addErrback(onError);
		df.addCallback(function() {
			dojo.publish("fsSizeChange", [to]);
		})
		return df;
    },
	getQuota: function(/*String*/path, /*Function*/onComplete, /*Function?*/onError) {
		//	summary:
		//		Gets the ammount of space available, and the ammount of space used for the path specified
		//	onComplete:
		//		a callback function once the task is done. First argument is an object with the following keys:
		//		|{
		//		|	total: 0, //the quota limit
		//		|	remaining: 0, //the remaining space
		//		|	used: 0 //the used portion of the quota
		//		|}
		//		All measurements are in bytes
		//	onError:
		//		a callback function to be fired on error
		var df = new dojo.Deferred();
        var xhr = api.xhr({
	        backend: "api.fs.io.getQuota",
			content: {
				path: path
			},
			load: function(data, ioArgs) {
				df.callback(data);
			},
	        error: function(e) {
				df.errback(e);
			},
			handleAs: "json"
        });
		df.canceler = dojo.hitch(xhr, "cancel");
		if(onComplete) df.addCallback(onComplete);
		if(onError) df.addErrback(onError);
		
		return df;
	},
	download: function(/*String*/path, /*String?*/as) {
		//	summary:
		//		Points the browser to the file and forces the browser to download it.
		//	path:
		//		the path to the file or folder that needs to be downloaded
		//	as:
		//		Specify this argument to compress the file/folder in an archive
		//		Possible values are "zip", "gzip", or "bzip"
		//		When this argument is not provided, it downloads the uncompressed file.
		//		If downloading a directory, this argument defaults to "zip".
		var url = api.xhr("api.fs.io.download") + "&path=" + encodeURIComponent(path) + (as ? "&as=" + encodeURIComponent(as) : "");
		var frame = dojo.io.iframe.create("fs_downloadframe", "");
		dojo.io.iframe.setSrc(frame, url, true);
	},
	embed: function(/*String*/path) {
		//	summary:
		//		Generates a URL that you can use in an img tag or an embed tag.
		//	path:
		//		the path to the file on the filesystem
		//	returns:
		//		a string containing a url
		return api.xhr("api.fs.io.display") + "&path=" + path;
	},
	info: function(/*String*/path, /*Function?*/onComplete, /*Function?*/onError) {
		//	summary:
		//		fetches information about a file
		//	path:
		//		the path to the file
		//	onComplete:
		//		a callback function to be fired on completion. First argument is an api.filesystem._fileInfo object
		//	onError:
		//		a callback function to be fire on an error.
		var df = new dojo.Deferred();
		var xhr = api.xhr({
			backend: "api.fs.io.info",
			content: {
				path: path
			},
			load: function(data, args) {
				df.callback(data);
			},
			error: function(e) {
				df.errback(e);
			},			
			handleAs: "json"
		})
		df.canceler = dojo.hitch(xhr, "cancel");
		if(onComplete) df.addCallback(onComplete);
		if(onError) df.addErrback(onError);
		
		return df;
	},
	_onError: function(code, callback) {
		var nf = dojo.i18n.getLocalization("api", "filearea");
		if(code == 12) { //remote_authentication_failed
			var win = new api.Window({
				title: nf.enterPass,
				width: "250px",
				height: "120px"
			});
			var v = new api.filesystem._PassForm({
				region: "center",
				onCancel: function() {win.destroy();},
				onSubmit: function() {
					callback(this.getPassword(), this.getRemember());
				}
			});
			win.addChild(v);
			win.show();
			win.startup();
		}
		else if(code == 13) { //remote_connection_failed
			api.ui.notify(nf.connFailed);
		}
	}
}

dojo.declare("api.filesystem._PassForm", [dijit._Widget, dijit._Templated, dijit._Contained], {
	templatePath: dojo.moduleUrl("api", "templates/Filearea_PassForm.html"),
	widgetsInTemplate: true,
	postCreate: function() {
		var nf = dojo.i18n.getLocalization("api", "filearea");
		this.titleNode.innerHTML = nf.enterPass;
		this.forgetLabelNode.innerHTML = nf.forgetImmediate;
		this.rememberForeverLabelNode.innerHTML = nf.rememberForever;
		console.log(this.connectNode);
		this.connectNode.setLabel(nf.connect);
		this.cancelNode.setLabel(nf.cancel);
		dojo.connect(this.cancelNode, "onClick", this, "onCancel");
		dojo.connect(this.connectNode, "onClick", this, "onSubmit");
	},
	getPassword: function() {
		return this.passwordNode.getValue();
	},
	getRemember: function() {
		if(this.rememberForeverNode.checked)
			return "forever";
		else if(this.forgetNode.checked)
			return "forget";
	},
	onSubmit: function() {
		
	},
	onCancel: function() {
		
	}
});
