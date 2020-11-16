const users = []


const addUser = ({id, username, roomname}) => {
	username = username.trim().toLowerCase()
	roomname = roomname.trim().toLowerCase()
	console.log(roomname);
	if (!username || !roomname) {
		return {
			error: 'Username and Room are required'
		}
	}

	const existingUser = users.find((user) => {return user.username === username && user.roomname === roomname})
	if (existingUser) {
		return {
			error: 'Username is already existed for this room'
		}
	}
	const user = {
		id,
		username,
		roomname
	}
	users.push(user)
	return {user}
}

const removeUser = (id) => {
	const index = users.findIndex((user) => {return user.id === id})
	if (index != -1) {
		return users.splice(index, 1)[0]
	}

}

const getUser = (id) => {
	const index = users.findIndex((user) => {return user.id === id})
	if (index != -1) {
		const user = users[index]
		return {user}
	} 
	return {error : 'Cannot find user'}
}

const getUsersInRoom = (roomname) => {
	const usersInRoom =  users.filter((user) => {return user.roomname === roomname})
	if (!usersInRoom) {
		return []
	}

	return usersInRoom
}

module.exports = {
	addUser,
	removeUser,
	getUser,
	getUsersInRoom
}