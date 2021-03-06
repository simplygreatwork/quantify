
const logger = require('../src/logger')()
const Bits = require('../src/bits')

encode(0)
encode(1)
encode(2)
encode(3)

function encode(value) {
	
	let circuit = Circuit(`superdense value: ${value}`, 2)
	let alice = circuit.alice()
	let bob = circuit.bob()
	circuit.entangle(alice, bob)
	alice.encode(value)
	circuit
	.detangle(alice, bob)
	.run()
	let result = circuit.measure().toNumber()
	logger.log(`The value encoded to Alice is ${value}.`)
	logger.log(`The value decoded from Alice and Bob together is ${result}.\n`)
}

function Circuit(name, size, options) {
	
	let circuit = require('../src/circuit.js')({
		name: name,
		size: size,
		logger: logger,
		engine: 'optimized',
		order: ['targets', 'controls']
	})
	
	return Object.assign(circuit, {
		
		alice: function() {
			
			let alice = this.unit(0)
			return Object.assign(alice, {
				encode: function(value) {
					let array = Bits.fromNumber(value, 2).toArray()
					if (array.pop()) alice.z()
					if (array.pop()) alice.x()
				}
			})
		},
		
		bob: function() {
			return this.unit(1)
		},
		
		entangle: function(alice, bob) {
			
			alice.h()
			bob.cx(0)
			return this
		},
		
		detangle: function(alice, bob) {
			
			bob.cx(0)
			alice.h()
			return this
		}
	})
}
