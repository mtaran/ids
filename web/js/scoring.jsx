function bestId(filter, a, b) {
	// the higher the better, and we want highest first
	return getWordScore(filter, b) - getWordScore(filter, a);
}

function getWordScore(filter, id) {
	// the higher the better
	var word = id.wholeWord || id.word
	var score = getBasicScore(filter, word)
	score -= (id.width * id.height) / 2000
	return score
}

function bestExtra(filter, a, b) {
	return getBasicScore(filter, b) - getBasicScore(filter, a)
}

function getBasicScore(filter, word) {
	if (!word || !filter || !word.toLowerCase || !filter.toLowerCase) {
		return -Infinity
	}
	var index = word.toLowerCase().indexOf(filter.toLowerCase());
	var score = 0;
	if (index == -1) {
		return -Infinity;
	} else if (index == 0) {
		score += 2;
	} else {
		score += 1;
	}
	if (filter.length == word.length) {
		score += 5
	}
	score += 3*(filter.length/word.length)
	return score;
}

/**
 * Not yet used, but should improve the speed to find the top 20 matches.
 */
function quickSort(data, opt_keyFn, opt_n, opt_memo) {
	if (data.length <= 1) {
		return data;
	}
	var n = opt_n === undefined ? Infinity : opt_n;
	var smaller = [];
	var greater = [];
	var first = data[0];

	if (first === undefined) { 
		return; 
	}

	var pivot = first;

	function getKey(item) {
		if (!opt_memo) {
			opt_memo = new Map();
		}
		if (opt_memo.has(item)) {
			return opt_memo.get(item);
		} else {
			var key = opt_keyFn ? opt_keyFn(item) : item;
			opt_memo.set(item, key);
			return key;
		}
	}

	for (var i = 1; i < data.length; i++) {
		var item = data[i];
		var pivotKey = getKey(pivot)
		var itemKey = getKey(item);

		if (itemKey < pivotKey) {
			smaller.push(item);
		} else {
			greater.push(item);
		}
	}

	var out = [];
	out = out.concat(quickSort(smaller, opt_keyFn, n, opt_memo));
	if (out.length == n) {
		return out;
	}
	out.push(pivot);
	if (out.length == n) {
		return out;
	}
	out = out.concat(quickSort(greater, opt_keyFn, n - out.length, opt_memo));
	return out;
};