const generateMessage = (question, answer) => {
	return {
		question,
		answer,
		createdAt: new Date().getTime()
	}
}

const generateLocation = (location) => {
	return {
		url: `https://google.com/maps?q=${location.latitude},${location.longitude}`,
		createdAt: new Date().getTime()
	}
}

module.exports = {
	generateMessage,
	generateLocation
}