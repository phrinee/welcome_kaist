const MonkeyLearn = require('monkeylearn')

const ml = new MonkeyLearn('eb501d24660013f970ac3464b1588c822b1b5a71')
let model_id = 'ex_YCya9nrn'

const keyword = (data) => {
   const result = ml.extractors.extract(model_id, data)
   return result
}

module.exports = {keyword}