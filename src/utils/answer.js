const axios = require('axios')

const answer = (question, keyword) => {
    const res = axios({
        method: 'post',
        url: 'http://welcome-kaist-model.herokuapp.com/answer',
        data: {
          question: question,
          keyword: keyword
        }
      })
    return res
}

const boostFlaskServer = () => {
  const res = axios({
      method: 'post',
      url: 'https://welcome-kaist-model.herokuapp.com/answer',
      data: {
        question: "Hello",
        keyword: ''
      }
    })
  return res
}

module.exports = {
  answer,
  boostFlaskServer
}