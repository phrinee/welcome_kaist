const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form') 
const $messageBox = $messageForm.querySelector('#message-box')
const $messageSendButton = $messageForm.querySelector('#send-message')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')
//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
const $request = document.querySelector("#request")
const $response = document.querySelector("#response")

//Options
const { username} = Qs.parse(location.search, { ignoreQueryPrefix: true })

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

const createChat = (message, username, id, keywords) => {
	var div = document.createElement("div")
		div.className += "message" 
		div.id = id
		var p = document.createElement("p")
		var name = document.createElement("span")
		name.className += "message__name"
		name.innerHTML = username
		var created = document.createElement("span")
		created.className += "message__meta"
		created.innerHTML = moment(message.createdAt).format('h:mm a')
		p.appendChild(name)
		p.appendChild(created)
		if (id == 'response') {
			var mess = document.createElement("p")
			mess.innerHTML = message.text
			div.appendChild(p)
			div.appendChild(mess)
		} else {
			div.appendChild(p)
			tmp = message.text.toLowerCase()
			map = new Map()
			for (var i = 0; i < keywords.length; i++) {
				let regexp = keywords[i]
				let str = tmp

				let matches = [...str.matchAll(regexp)];
				matches.forEach((match) => {
					map.set(match.index,regexp)
				});
			}
			console.log(map)
			let cur = 0
			for (var i = 0; i < tmp.length; i++) {
				if (map.has(cur) == true) {
					var span = document.createElement('span');
					span.innerHTML = message.text.substring(cur, map.get(cur).length+cur)
					span.className = "popup_span"
					cur += map.get(cur).length
					div.appendChild(span)
				} else {
					div.appendChild(document.createTextNode(message.text[cur]))
					cur += 1
				}
				if (cur == message.text.length) {
					break
				}
			}
		}
		$messages.appendChild(div)
}

socket.on('message', (message, username, roomname, keywords) => {
	if (username != 'chatbot') {
		createChat(message, username, "request", keywords)
	} else {
		createChat(message, username, "response", keywords)
	}
	
	autoscroll() 
	if (username != 'chatbot') {
		socket.emit('new_message', {message, roomname}, (error) => {
			if (error) {
				alert(error)
				location.href = '/'
			}
		})
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
	socket.emit('sendMessage', $messageBox.value, (error) => {
		$messageSendButton.removeAttribute('disabled')
		$messageBox.value = ''
		$messageBox.focus()
		if (error) {
			alert(error)
			location.href = '/'
		}
		console.log('The message was delivered');
	})
})

socket.emit('join', {username}, (error) => {
	if (error) {
		alert(error)
		location.href = '/'
	}
}) 
