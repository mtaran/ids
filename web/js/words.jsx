
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


var SCALE = 0.5

function readLocal(key,defaultVal) {
	if (localStorage.hasOwnProperty("ids/"+key)) {
		return localStorage['ids/'+key]
	}
	else
		return defaultVal
}
function writeLocal(key, val) {
	return localStorage["ids/"+key] = val
}

var WordRow = React.createClass({
	handleChange: function(e) {
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

var firebase = new Firebase('https://idannotations.firebaseio.com/');
var Main = React.createClass({
	mixins: [ReactFireMixin],
	getInitialState: function() {
		return {
			allIds: {},
			filter: readLocal('dictFilter', 'id')
		}
	},
	componentWillMount: function() {
		this.bindAsObject(firebase.child('ids'), 'allIds');
	},
	updateFilter: function(e) {
		this.setState({filter:e.target.value})
		writeLocal('dictFilter', e.target.value)
	},
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
			for (var i = 0; i < sortedIds.length && curIndex < pageNum*20; i++) {
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
				if (words.length >= 20) {
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
	nextPage: function() {
		this.setState({filter:'#'+(this.getFilterPage()+1)})
	},
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