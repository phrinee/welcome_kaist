const questions = new Map();

const addClient = (id) => {
    questions.set(id, new Map())
}

const handleQuestion = (id, question, b) => {
    client = questions.get(id)
    if (b) {
        client.set(question, 1)
    } else {
        client.set(question, 0)
    }
}

const getClient = (id) => {
    if (questions.has(id)) {
        return questions.get(id)
    }
    return new Map()
}

module.exports = {
    addClient,
    handleQuestion,
    getClient
}