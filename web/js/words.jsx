
/*
ids data:

pagenum:
	boxnum:
		pagenum: str
		boxnum: str
		word: str
		height: int
		width: int
*/

var firebase = new Firebase('https://idannotations.firebaseio.com/');

/**
 * Component for a single row with an english word and the ids corresponding to 
 * that row.
 */
var WordRow = React.createClass({
	propTypes: {
		word: React.PropTypes.string.isRequired,
		ids: React.PropTypes.array.isRequired,
	},
	render: function() {
		return (
			<div className="wordRow">
				<div className="word">{this.props.word}</div>
				{this.props.ids.map(function(id,i) {
					return <IdImg id={id} key={id.pagenum+'.'+id.boxnum}/>
				})}
			</div>
		)
	}
})

/**
 * How many words to show on a page of results.
 * @type {number}
 */
var NUM_WORDS_PER_PAGE = 20;

/**
 * Root component for the words.html page.
 *
 * Renders an input box into the top bar, which can be used to search for ids 
 * (or by using syntax like '#2' to view the second page of ids). For the main
 * content, just renders the PageRow components for the words that match the
 * search query, up to NUM_WORDS_PER_PAGE.
 *
 * Searching currently does a case-insensitive substring match, with some basic
 * heuristics for ordering.
 *
 * Data comes from /ids in Firebase, bound to this.props.allIds.
 */
var Main = React.createClass({
	mixins: [ReactFireMixin],
	getInitialState: function() {
		return {
			allIds: {},
			filter: readLocal('dictFilter', 'id') // saved in localStorage
		}
	},
	componentWillMount: function() {
		this.bindAsObject(firebase.child('ids'), 'allIds');
	},
	/**
	 * Gets the page that the search box says we should be on, if in the format
	 * of '#N', or null otherwise.
	 * @return {?number}
	 */
	getFilterPage: function() {
		if (this.state.filter.indexOf('#') != 0) {
			return null;
		}
		var num = +this.state.filter.replace(/^#/, '')
		if (isNaN(num)) {
			return null;
		}
		return num;
	},
	/**
	 * Gets the groups of ids corresponding to the words that should be shown
	 * based on the current query string.
	 * @return {Array<Array<Id>>}
	 */
	getCurrentWords: function() {
		var ids = []
		for (var pagenum in this.state.allIds)
			for (var boxnum in this.state.allIds[pagenum])
				ids.push(this.state.allIds[pagenum][boxnum])
		if (ids.length == 0) {
			return []
		}
		var pageNum = this.getFilterPage()
		if (pageNum != null) {
			// paginated mode!
			var sortedIds = ids.sort(function alphabeticalByWord(a, b) {
				if (a.word.toLowerCase() < b.word.toLowerCase()) return -1
				if (a.word.toLowerCase() > b.word.toLowerCase()) return 1
				return 0
			})
			var curWord = sortedIds[0].word
			var curIndex = 0;
			var wordNum = pageNum*NUM_WORDS_PER_PAGE;
			for (var i = 0; i < sortedIds.length && curIndex < wordNum; i++) {
				if (sortedIds[i].word == curWord) {
					continue
				} else {
					curWord = sortedIds[i].word
					curIndex++
				}
			}

			ids = ids.slice(i)
		} else {
			ids = ids
				.sort(bestId.bind(null, this.state.filter))
				.filter(function(id) {
					return getWordScore(this.state.filter, id) > -Infinity
				}.bind(this));
		}

		return ids
			.reduce(function(words, id, i, ids) {
				if (words.length >= NUM_WORDS_PER_PAGE) {
					return words
				}
				for (var i = 0; i < words.length; i++)
					if (words[i].text == id.word)
						return words

				var word = {text:id.word, ids:[id]}
				for (var i = 0; i < ids.length; i++)
					if (ids[i].word == id.word && word.ids.indexOf(ids[i]) == -1)
						word.ids.push(ids[i])

				words.push(word)
				return words
			}.bind(this), [])
	},
	/**
	 * Handler for change events on the search box input component.
	 * @param  {Event} e
	 */
	updateFilter: function(e) {
		this.setState({filter:e.target.value})
		writeLocal('dictFilter', e.target.value)
	},
	/**
	 * Handler for the prev next button, which switches the view to the next page
	 * of ids.
	 */
	nextPage: function() {
		this.setState({filter:'#'+(this.getFilterPage()+1)})
	},
	/**
	 * Handler for the prev page button, which switches the view to the previous
	 * page of ids.
	 */
	prevPage: function() {
		this.setState({filter:'#'+(this.getFilterPage()-1)})
	},
	render: function() {
		var filterPage = this.getFilterPage()
		var currentWords = this.getCurrentWords()
		return (
			<div>
				<TopBar>
					<input className="filter"
						value={this.state.filter} 
						onChange={this.updateFilter}
						autoFocus
					/>
					{filterPage != null && [
						<button 
							onClick={this.prevPage} 
							disabled={filterPage == 0}
							key="prev"
						>&lt;</button>,
						<button 
							onClick={this.nextPage} 
							disabled={currentWords.length == 0 && this.state.allIds.length != 0}
							key="next"
						>&gt;</button>,
					]}
				</TopBar>
				<Content loading={!this.state.allIds.length}>
					{currentWords.map(function(word, i) {
						return word && <WordRow 
							word={word.text} 
							key={i} 
							num={i}
							ids={word.ids}
							allIds={this.state.allIds}
						/>
					}.bind(this))}
				</Content>
			</div>
		)
	}
})

React.render(
	<Main />,
	document.getElementById('top')
);