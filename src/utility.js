
const gates = require('./derived/quantastica/gates')

module.exports = {
	
	arrayify: function(value) {
		
		if (value === null) return []
		if (value === undefined) return []
		if (! Array.isArray(value)) return [value]
		return value
	},
	
	install_gates: function(object, circuit) {
		
		let chain = this
		Object.keys(gates).forEach(function(key) {
			object[key.toLowerCase()] = function(targets, controls, options) {
				let name = this
				circuit.addGate(name, targets, controls, options)
				return object
			}.bind(key)
		}.bind(this))
	}
}
