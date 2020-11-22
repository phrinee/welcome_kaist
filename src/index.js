const express = require('express')
const http = require('http')
const path = require('path')
const hbs = require('hbs')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage} = require('./utils/messages.js') 
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users.js')
const { v4: uuidv4 } = require('uuid');
const extractor = require('./utils/keyword.js')
const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT
const publicDirPath = path.join(__dirname, '../public')
const partialsPath = path.join(__dirname, '../templates/partials')
const {answer} = require('./utils/answer.js')
app.use(express.static(publicDirPath))
// app.set('views', viewPath)
// app.set('view engine', 'hbs')
hbs.registerPartials(partialsPath)


// app.get('', (req, res) => {
// 	res.render('index', {
// 		title: 'Chat App',
// 	})
// })



io.on('connection', (socket) => {
	console.log('new web socket connection')
	

	socket.on('sendMessage', (message, callback) => {
		const {error, user} = getUser(socket.id)
		if (error) {
			return callback(error)
		}
		const filter = new Filter()
		if (filter.isProfane(message)) {
			return callback('Bad words are not allowed')
		}
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
		socket.broadcast.to(user.roomname).emit('message', generateMessage(`${user.username} has joined this room`), 'Chat App')
		
		io.to(user.roomname).emit('roomData', {
			roomname: user.roomname,
			users: getUsersInRoom(user.roomname)
		})

		callback()

	})

	socket.on('new_message', (options) => {
		const res = answer(options.message.text, options.keywords[0])
		res.then((response) => {
			io.to(options.roomname).emit('message', generateMessage(response.data['response']), 'chatbot', options.roomname, [])
		}, (error) => {
			console.log(error);
		});
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