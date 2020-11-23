const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage} = require('./utils/messages.js') 
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users.js')
const { v4: uuidv4 } = require('uuid');
const extractor = require('./utils/keyword.js')
const app = express()
const server = http.createServer(app)
const {PythonShell} = require('python-shell')
const io = socketio(server)

const port = process.env.PORT
const publicDirPath = path.join(__dirname, '../public')
const BERTPath = path.join(__dirname, '/model/BERT.py')
const detectQuestion = path.join(__dirname, '/model/detectQuestion.py')
app.use(express.static(publicDirPath))
// app.set('views', viewPath)
// app.set('view engine', 'hbs')


// app.get('', (req, res) => {
// 	res.render('index', {
// 		title: 'Chat App',
// 	})
// })

io.on('connection', (socket) => {
	var inactiveTimer;
	var logoffTimer;
	socket.on('sendMessage', (message, callback) => {
		const {error, user} = getUser(socket.id)
		if (error) {
			return callback(error)
		}
		const filter = new Filter()
		if (filter.isProfane(message)) {
			return callback('Bad words are not allowed')
		}
		clearTimeout(inactiveTimer)
		clearTimeout(logoffTimer)
		// var myPythonScriptPath = detectQuestion
		// var pyshell = new PythonShell(myPythonScriptPath)
		// pyshell.send(JSON.stringify({message: message}));
		// pyshell.on('message', function (data) {
		// 	if (data.toLowerCase().includes('question')) {
				
		// 	} else {
		// 		io.to(user.roomname).emit('message', generateMessage(message), user.username, user.roomname, [])
		// 	}
		// });
		// pyshell.end(function (err) {
		// 	if (err){
		// 		throw err;
		// 	};
		// })	
		pending = extractor.keyword([message])
		pending.then(res => {
			keywords = []
			for (i = 0; i < res.body[0]["extractions"].length; i++) {
				keywords.push(res.body[0]["extractions"][i]["parsed_value"])
			}
			io.to(user.roomname).emit('message', generateMessage(message), user.username, user.roomname, keywords)
			callback()
		})	
	})

	socket.on('join', (options,  callback) => {

		const {error, user} = addUser({id:socket.id, username:options.username, roomname:uuidv4().toString()})

		if (error) {
			return callback(error)
		}
		socket.join(user.roomname)
		socket.emit('message', generateMessage('Welcome to the app'), 'chatbot')
		inactiveTimer = setTimeout(function(){
            io.to(user.roomname).emit('message', generateMessage('Do you have any questions?'), 'chatbot', options.roomname, [])
        }, 60000);
		io.to(user.roomname).emit('roomData', {
			roomname: user.roomname,
			users: getUsersInRoom(user.roomname)
		})
		logoffTimer = setTimeout(function(){
            io.to(user.roomname).emit('logoff')
		}, 60000*5);

		callback()

	})

	socket.on('new_message', (options) => {
		// var res
		// if (options.keywords.length > 0) {
		// 	res = answer(options.message.text, options.keywords[0])
		// } else {
		// 	res = answer(options.message.text, '')
		// }
		// res.then((response) => {
		// 	io.to(options.roomname).emit('message', generateMessage(response.data['response']), 'chatbot', options.roomname, [])
		// }, (error) => {
		// 	console.log(error);
		// });
		var myPythonScriptPath = BERTPath
		var pyshell = new PythonShell(myPythonScriptPath)
		if (options.keywords.length > 0) {
			pyshell.send(JSON.stringify({question: options.message.text, keyword: options.keywords[0]}));
		} else {
			pyshell.send(JSON.stringify({question: options.message.text, keyword: ''}));
		}
		
		pyshell.on('message', function (message) {
			io.to(options.roomname).emit('message', generateMessage(message), 'chatbot', options.roomname)
		});
		pyshell.end(function (err) {
			if (err){
				throw err;
			};
		})
		inactiveTimer = setTimeout(function(){
            io.to(options.roomname).emit('message', generateMessage('Do you have any questions?'), 'chatbot', options.roomname, [])
		}, 60000);
		logoffTimer = setTimeout(function(){
            io.to(options.roomname).emit('logoff')
		}, 60000*5);
	})

	socket.on('disconnect', () => {
		const user = removeUser(socket.id)
		console.log(user);
		if (user) {
			io.to(user.roomname).emit('message', generateMessage(`${user.username} left the chat room`), 'Chat App')
			io.to(user.roomname).emit('roomData', {
				roomname: user.roomname,
				users: getUsersInRoom(user.roomname)
			})
		}
	})
})

server.listen(port, () => {
	console.log('Server started on port ' + port);
})