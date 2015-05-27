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