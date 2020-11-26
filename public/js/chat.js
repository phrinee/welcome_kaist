const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form') 
const $messageBox = $messageForm.querySelector('#message-box')
const $messageSendButton = $messageForm.querySelector('#send-message')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')
//Templates
const messageTemplateRequest = document.querySelector('#message-template-request').innerHTML
const messageTemplateResponse = document.querySelector('#message-template-response').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
const $request = document.querySelector("#request")
const $response = document.querySelector("#response")

var timeout = false;
//Options
const { username} = Qs.parse(location.search, { ignoreQueryPrefix: true })
var cnt = ''
const autoscroll = () => {
	const $newMessage = $messages.lastElementChild

	const newMessageStyle = getComputedStyle($newMessage)
	const newMessageMarginBottom = parseInt(newMessageStyle.marginBottom)
	const newMessageHeight = $newMessage.offsetHeight + newMessageMarginBottom

	const containerHeight = $messages.scrollHeight
	const scrollOffSet = $messages.scrollTop + $messages.offsetHeight

	if (containerHeight - newMessageHeight <= scrollOffSet) {
		$messages.scrollTop = $messages.scrollHeight 
	}	
}

const createChatBubble = () => {
	var chatBubble = document.createElement("div")
	chatBubble.className += "chat-bubble"
	chatBubble.id = "chatBubble"
	var typing = document.createElement("div")
	typing.className += "typing"
	for (var i = 0; i<3; i++) {
		var dot = document.createElement("div")
		dot.className += "dot"
		typing.appendChild(dot)
	}
	chatBubble.appendChild(typing)
	return chatBubble
}

const createStar = (id, question) => {
	var holder = document.createElement("div")
	holder.className += 'icon-wraper'
	var span = document.createElement("span")
	span.className = "unlike"
	cnt += 'a'
	span.id = cnt
	span.onclick = () => {
		if (span.className == 'unlike') {
			socket.emit('vote', id, question, true)
			span.className = 'like'
		} else {
			socket.emit('vote', id, question, false)
			span.className = 'unlike'
		}
	}
	var star = document.createElement("i")
	star.className ='fas fa-star'
	span.appendChild(star)
	holder.appendChild(span)
	return holder
}

const createChat = (message, username, id, keywords, roomname) => {
	var div = document.createElement("div")
	div.className += "message" 
	div.id = id
	var p = document.createElement("div")
	var name = document.createElement("span")
	name.className += "message__name"
	name.innerHTML = username
	if (username == 'admin') {
		name.innerHTML = 'chatbot'
	}
	var created = document.createElement("span")
	created.className += "message__meta"
	created.innerHTML = moment(message.createdAt).format('h:mm a')
	p.appendChild(name)
	p.appendChild(created)
	var mess = document.createElement("p")
	if (id != 'request') {
		mess.innerHTML = message.answer
	} else {
		mess.innerHTML = message.question
	}
	
	div.appendChild(p)
	div.appendChild(mess)
	
	if (id == 'response' && username == 'chatbot') {
		var star = createStar(roomname, message.question)
		div.appendChild(star)
	} 
		// str = message.text.toLowerCase()
		// map = new Map()
		// for (var i = 0; i < keywords.length; i++) {
		// 	let regexp = keywords[i]
		// 	let matches = [...str.matchAll(regexp)];
		// 	matches.forEach((match) => {
		// 		map.set(match.index,regexp)
		// 	});
		// }
		// let cur = 0
		// for (var i = 0; i < str.length; i++) {
		// 	if (map.has(cur) == true) {
		// 		var span = document.createElement('span');
		// 		span.innerHTML = message.text.substring(cur, map.get(cur).length+cur)
		// 		span.className = "popup_span"
		// 		cur += map.get(cur).length
		// 		div.appendChild(span)
		// 	} else {
		// 		div.appendChild(document.createTextNode(message.text[cur]))
		// 		cur += 1
		// 	}
		// 	if (cur == message.text.length) {
		// 		break
		// 	}
		// }
	if (document.getElementById("chatBubble") != null ) {
		document.getElementById("chatBubble").remove()
	}
	$messages.appendChild(div)
}

socket.on('message', (message, username, roomname, keywords) => {
	if (username == 'chatbot' || username == 'admin') {
		createChat(message, username, "response", keywords, roomname)
	} else {
		createChat(message, username, "request", keywords, roomname)
		if (message.question.toLowerCase().includes('goodbye')) {
			socket.emit('endsession', roomname)
		}
	}
	
	autoscroll() 
	if (username != 'chatbot' && username != 'admin' && message.question.toLowerCase().includes('goodbye') == false) {
		socket.emit('new_message', {message, roomname, keywords}, (error) => {
			if (error) {
				alert(error)
				location.href = '/'
			}
		})
		var chatBubble = createChatBubble()
		$messages.appendChild(chatBubble)
	}
	
})

socket.on('roomData', ({roomname, users}) => {
	const html = Mustache.render(sidebarTemplate, {
		roomname,
		users
	})
	$sidebar.innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
	e.preventDefault()
	$messageSendButton.setAttribute('disabled', 'disabled')
	question = $messageBox.value
	$messageSendButton.removeAttribute('disabled')
	$messageBox.focus()
	questions = JSON.parse(sessionStorage.getItem("questions"));
	questions.push(question)
	sessionStorage.setItem("questions", JSON.stringify(questions))
	socket.emit('sendMessage', question, (error) => {
		if (error) {
			alert(error)
			location.href = '/'
		}
		console.log('The message was delivered');
	})
	$messageBox.value = ''
})

socket.emit('join', {username}, (error) => {
	if (error) {
		alert(error)
		location.href = '/'
	}
	sessionStorage.setItem("questions", JSON.stringify([]))
})

socket.on('logoff', () => {
	setTimeout(function () {
		location.href = '/rating.html'
	}, 2000)
})

