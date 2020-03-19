const { format } = require('date-fns')

module.exports = (dateObj, f = 'LLL d, y') => {
  return format(dateObj, f)
}
