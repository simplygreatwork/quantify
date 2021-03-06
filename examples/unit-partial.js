
const logger = require('../src/logger')()

let circuit = Circuit('a unit of an individual qubit', 1)
let alice = circuit.unit(0)
alice.h()
circuit.run()

circuit = Circuit('a unit of an individual qubit and a unit of 2 qubits', 3)
let single = circuit.unit(0)
let pair = circuit.unit(1, 2)
single.x()
pair.h()
circuit.run()

function Circuit(name, size) {
	
	return require('../src/circuit.js')({
		name: name,
		size: size,
		logger: logger,
		engine: 'optimized',
		order: ['targets', 'controls']
	})
}
