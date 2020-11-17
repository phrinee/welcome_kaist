const MonkeyLearn = require('monkeylearn')

const ml = new MonkeyLearn('2c5054c93ca0981de34c65d2d4c17a88251e6924')
let model_id = 'ex_YCya9nrn'

const keyword = (data) => {
   const result = ml.extractors.extract(model_id, data)
   return result
}

module.exports = {keyword}