
const logger = require('../src/logger')()
const Bits = require('../src/bits')

frequency ({ period: 3, size: 4 })
frequency ({ period: 5, size: 4 })
frequency ({ period: 6, size: 4 })
frequency ({ period: 7, size: 4 })
frequency ({ period: 10, size: 5 })
frequency ({ period: 10, size: 6 })

function frequency(options) {
	
	input(options.period, options.size)
	output(options.period, options.size)
}

function input(period, size) {
	
	Circuit(`input phases for a period of ${period} using ${size} qubits`, size)
	.period(period)
	.run()
}

function output(period, size) {
	
	let circuit = Circuit(`output for a period of ${period} using ${size} qubits`, size)
	.period(period)
	.qft(size)
	let shots = 1000, tally = 0
	repeat(shots, function() {
		circuit.run()
		tally = tally + circuit.measure().invert().toNumber() + 1
	})
	let power = Math.pow(2, size)
	logger.log(`The frequency is approximately ${tally / shots} from a period of ${period} in ${power}. (${power} / ${period} = ${power / period})\n`)
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
		
		period: function(period) {
			
			return this
			.unit('all').h().circuit()
			.spread(function(index) {
				this.u1(index, [], { lambda: 'pi / ' + period / 2 })
			})
		},
		
		spread: function(fn) {
			
			for (var i = 0; i < this.size; i++) {
				for (var j = 0; j < 1 << i; j++) {
					fn.apply(this, [i])
				}
			}
			return this
		},
		
		qft: function(size) {
			return this['qft_' + this.size]()
		},
		
		qft_4: function() {
			
			return this
			.h(3)
				.cu1(3, 2, { lambda: "pi/2" })
			.h(2)
				.cu1(3, 1, { lambda: "pi/4" })
				.cu1(2, 1, { lambda: "pi/2" })
			.h(1)
				.cu1(3, 0, { lambda: "pi/8" })
				.cu1(2, 0, { lambda: "pi/4" })
				.cu1(1, 0, { lambda: "pi/2" })
			.h(0)
			.swap(0, 3)
			.swap(1, 2)
		},
		
		qft_5: function() {
			
			return this
			.h(4)
				.cu1(4, 3, { lambda: "pi/2" })
			.h(3)
				.cu1(4, 2, { lambda: "pi/4" })
				.cu1(3, 2, { lambda: "pi/2" })
			.h(2)
				.cu1(4, 1, { lambda: "pi/8" })
				.cu1(3, 1, { lambda: "pi/4" })
				.cu1(2, 1, { lambda: "pi/2" })
			.h(1)
				.cu1(4, 0, { lambda: "pi/16" })
				.cu1(3, 0, { lambda: "pi/8" })
				.cu1(2, 0, { lambda: "pi/4" })
				.cu1(1, 0, { lambda: "pi/2" })
			.h(0)
			.swap(0, 4)
			.swap(1, 3)
		},
		
		qft_6: function() {
			
			return this
			.h(5)
				.cu1(5, 4, { lambda: "pi/2" })
			.h(4)
				.cu1(5, 3, { lambda: "pi/4" })
				.cu1(4, 3, { lambda: "pi/2" })
			.h(3)
				.cu1(5, 2, { lambda: "pi/8" })
				.cu1(4, 2, { lambda: "pi/4" })
				.cu1(3, 2, { lambda: "pi/2" })
			.h(2)
				.cu1(5, 1, { lambda: "pi/16" })
				.cu1(4, 1, { lambda: "pi/8" })
				.cu1(3, 1, { lambda: "pi/4" })
				.cu1(2, 1, { lambda: "pi/2" })
			.h(1)
				.cu1(5, 0, { lambda: "pi/32" })
				.cu1(4, 0, { lambda: "pi/16" })
				.cu1(3, 0, { lambda: "pi/8" })
				.cu1(2, 0, { lambda: "pi/4" })
				.cu1(1, 0, { lambda: "pi/2" })
			.h(0)
			.swap(0, 5)
			.swap(1, 4)
			.swap(2, 3)
		}
	})
}

function repeat(number, fn) {
	
	for (let i = 0; i < number; i++) {
		fn.apply(this, [i])
	}
}
