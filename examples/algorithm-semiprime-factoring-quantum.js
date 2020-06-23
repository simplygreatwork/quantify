
const math = require('mathjs')
const logger = require('../src/logger')()
const Bits = require('../src/bits')

// basis: https://github.com/oreilly-qc/oreilly-qc.github.io/blob/master/samples/QCEngine/ch12_01_shor1.js
// a work in progress - not yet complete

if (true) run(15)
if (false) run(21)

function run(semiprime) {
	
	logger.log()
	logger.log(`Now factoring the semiprime number ${semiprime}.`)
	var result = factor({ semiprime: semiprime, coprime: 2 })
	if (result) logger.log(`${result[0]} * ${result[1]} = ${semiprime}`)
	else logger.log(`Factoring failed because no non-trivial factors were found.`)
	logger.log()
}

function factor(options) {
	
	let {semiprime, coprime} = options
	let precision = decide_precision(semiprime)
	logger.log(`The precision needed is ${JSON.stringify(precision)} bits.`)
	let periods = decide_periods(semiprime, coprime, precision)
	logger.log(`The periods detected are ${JSON.stringify(periods)}.`)
	let factors = decide_factors(semiprime, coprime, periods)
	logger.log(`The decided factors are ${JSON.stringify(factors)}.`)
	return factors
}

function decide_precision(semiprime) {
	
	let result = 0
	let table = [
		{ semiprime: 15, precision: 4 },
		{ semiprime: 21, precision: 5 },
		{ semiprime: 35, precision: 6 },
		{ semiprime: 123, precision: 7 },
		{ semiprime: 341, precision: 8 },
		{ semiprime: 451, precision: 9 }
	]
	table.forEach(function(each) {
		if ((result == 0) && (semiprime >= each.semiprime)) {
			result = each.precision
		}
	}.bind(this))
	return result
}

function decide_periods(semiprime, coprime, precision) {
	
	let period = null
	if (true) period = quantum_decide_period(semiprime, coprime, precision)
	if (false) period = classical_decide_period(semiprime, coprime, precision)
	return period
}

function decide_factors(semiprime, coprime, periods) {
	
	let result = null
	periods.forEach(function(period) {
		if (result) return
		let value = Math.pow(coprime, period / 2.0)
		let factor_a = math.gcd(semiprime, value - 1)
		let factor_b = math.gcd(semiprime, value + 1)
		if (factor_a * factor_b == semiprime) {
			if (factor_a != 1 && factor_b != 1) {
				result = [factor_a, factor_b]
				return 'break'
			}
		}
	})
	return result
}

function classical_decide_period(semiprime, coprime, precision) {
	
	let result = [0]
	let work = 1
	repeat(Math.pow(2, precision), function(index) {
		work = (work * coprime) % semiprime
		if (work === 1) {
			result = [index + 1]
			return 'break'
		}
	})
	return result
}

function quantum_decide_period(semiprime, coprime, precision) {
	
	let size = quantum_decide_size(semiprime, precision)
	let circuit = Circuit('finding the period', size.total)
	let number = circuit.number(size.number)
	logger.log(`The work length is ${number.length} bits.`)
	precision = circuit.precision(size.number, size.precision)
	logger.log(`The precision length is ${precision.length} bits.`)
	number.populate(precision)
	precision.qft()
	circuit.run()
	let result = number.measure().toNumber()
	logger.log(`The quantum circuit result is ${result}.`)
	let periods = quantum_estimate_spikes(result, 1 << precision.length)
	logger.log(`The quantum periods are ${JSON.stringify(periods)}.`)
	return periods
}

function quantum_decide_size(semiprime, precision) {
	
	let number = 1
	while ((1 << number) < semiprime) number++
	if (semiprime != 15) number++
	return { number: number, precision: precision, total: number + precision}
}

function Circuit(name, size) {
	
	let circuit = require('../src/circuit.js')({
		name: name,
		size: size,
		logger: logger,
		engine: 'optimized',
		order: ['targets', 'controls']
	})
	
	return Object.assign(circuit, {
		
		number: function(size) {
			
			let unit = this.unit(0, size)
			unit.unit(0).x()
			
			return Object.assign(unit, {
				
				populate: function(precision) {
					
					return this.circuit()
					.cswap([2, 3], 4)
					.cswap([1, 2], 4)
					.cswap([0, 1], 4)
					.cswap([1, 3], 5)
					.cswap([0, 2], 5)
					.cswap([0, 1], 5)
				}
			})
		},
		
		precision: function(index, length) {
			
			let unit = this.unit(index, length)
			unit.h()
			
			return Object.assign(unit, {
				
				result: function() {
					return null
				},
				
				qft: function() {
					this.circuit().qft(this.index, this.length)
				}
			})
		},
		
		qft: function(begin, length) {
			
			begin = begin || 0
			length = length || this.size
			this.repeat(length, function(index) {
				let inverse = (begin + length) - 1 - (index)
				this.h(inverse)
				for (let j = inverse - 1; j >= begin; j--) {
					this.cu1(inverse, j, { lambda: 'pi / ' + Math.pow(2, inverse - j) })
				}
			}.bind(this))
			for (let i = begin, length_ = Math.floor((begin + length) / 2); i < length_; i++) {
				this.swap(i, length_ - (i + 1))
			}
			return this
		},
		
		repeat: function(value, fn) {
			
			for (let i = 0; i < value; i++) {
				fn.apply(this, [i])
			}
			return this
		}
	})
}

function quantum_estimate_spikes(spike, range) {
	
	let result = []
	if (spike < range / 2) spike = range - spike
	let best_error = 1.0
	let e0, e1, e2 = 0
	let actual = spike / range
	for (let denominator = 1.0; denominator < spike; ++denominator) {
		var numerator = Math.round(denominator * actual)
		var estimated = numerator / denominator
		var error = Math.abs(estimated - actual)
		e0 = e1
		e1 = e2
		e2 = error
		if ((e1 <= best_error) && (e1 < e0) && (e1 < e2)) {
			var period = denominator - 1
			result.push(period)
			best_error = e1
		}
	}
	return result
}

function repeat(number, fn) {
	
	for (let i = 0; i < number; i++) {
		let result = fn.apply(this, [i])
		if (result === 'break') break
	}
}
