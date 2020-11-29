const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage} = require('./utils/messages.js') 
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users.js')
const {addClient, handleQuestion, getClient} = require('./utils/questions.js')
const { v4: uuidv4 } = require('uuid');
const extractor = require('./utils/keyword.js')
const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT
const publicDirPath = path.join(__dirname, '../public')
const {answer, boostFlaskServer} = require('./utils/answer.js')
const admin = require("firebase-admin");

const serviceAccount = require("./secret/cs492-humanai-firebase-adminsdk-kkgey-873a0925fc.json");
const refName = '/statistics' 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cs492-humanai.firebaseio.com"
});

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
		pending = extractor.keyword([message])
		pending.then(res => {
			keywords = []
			for (i = 0; i < res.body[0]["extractions"].length; i++) {
				keywords.push(res.body[0]["extractions"][i]["parsed_value"])
			}
			io.to(user.roomname).emit('message', generateMessage(message, ''), {}, user.username, user.roomname, keywords)
		})	
	})

	socket.on('join', (options,  callback) => {
		boostFlaskServer()
		const {error, user} = addUser({id:socket.id, username:options.username, roomname:uuidv4().toString()})
		addClient(user.roomname)
		if (error) {
			return callback(error)
		}
		socket.join(user.roomname)
		socket.emit('message', generateMessage('','Welcome to the app'),{}, 'admin')
		inactiveTimer = setTimeout(function(){
            io.to(user.roomname).emit('message', generateMessage('', 'Do you have any questions? If not please simply say Goodbye'), {}, 'admin', options.roomname, [])
        }, 60000*2);
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
		var res;
		if (options.keywords.length > 0) {
			res = answer(options.message.question, options.keywords.join(' '))
		} else {
			res = answer(options.message.question, '')
		}
		res.then((response) => {
			io.to(options.roomname).emit('message', generateMessage(options.message.question, response.data['response']), response.data['info'], 'chatbot', options.roomname, [])
			var db = admin.database();
			var ref = db.ref(refName).child(options.message.question.toLowerCase());
			ref.on("value", function(snapshot) {
				var info;
				if (snapshot.val() && snapshot.val() > 1) {
					info = 'There are ' +  snapshot.val() + ' people upvoted for this answer. If you found it helpful, please help us upvote it. We will appreciate your help.'
				} else if (snapshot.val() == 1){
					info = 'There is ' +  snapshot.val() + 'person upvoted for this answer. If you found it helpful, please help us upvote it. We will appreciate your help.'
				} else {
					info = 'No one upvoted for this answer yet. If you found it helpful, please help us upvote it. We will appreciate your help.'
				}
				io.to(options.roomname).emit('message', generateMessage('', info), {}, 'admin', options.roomname, [])
			}, function (errorObject) {
				console.log("The read failed: " + errorObject.code);
			});
		}, (error) => {
			console.log(error);
		});
		
		inactiveTimer = setTimeout(function(){
            io.to(options.roomname).emit('message', generateMessage('', 'Do you have any questions? If not please simply say Goodbye'), {}, 'admin', options.roomname, [])
		}, 60000*2);
		logoffTimer = setTimeout(function(){
            io.to(options.roomname).emit('logoff')
		}, 60000*5);
	})

	socket.on('vote', (id, question, b) => {
		tmp = question.toLowerCase()
		handleQuestion(id, tmp, b)
	})

	socket.on('disconnect', () => {
		const user = removeUser(socket.id)
		if (user) {
			tmp = getClient(user.roomname)
			var db = admin.database();
			var ref = db.ref(refName);
			for (let [key, value] of tmp) {
				if (value == 1) {
					ref.child(key).transaction(function (currentData) {
						return (currentData || 0) + 1
					})
				}
			}
		}
		
		
	})
	socket.on('endsession', (roomname) => {
		io.to(roomname).emit('logoff')
	})

	socket.on('keep', () => {
		console.log('keep')
	})
})

server.listen(port, () => {
	console.log('Server started on port ' + port);
})