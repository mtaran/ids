/*
past:
- word+'ed', word+lastLetter+'ed',wordEndingInE+'d',wordEndingInY+'ied'
progressive:
- word+'ing', word+lastLetter+'ing',wordEndingInE-'e'+'ing'

improvements:
- suffixes (-ed, -ing, -er)
- will/would

*/

function getBaseForIrreg(word, ids) {
	var past = []
	var participle = []
	for (var i = 0; i < word.length; i++) {
		var prefix = word.slice(0, i)
		var suffix = word.slice(i)
		if (irregular.past.hasOwnProperty(suffix)) {
			past.push(prefix+irregular.past[suffix])
		}
		if (irregular.participle.hasOwnProperty(suffix)) {
			past.push(prefix+irregular.participle[suffix])
		}
	}
	if (past.length == 0 && participle.length == 0) {
		return []
	}
	var out = []
	for (var i = 0; i < ids.length; i++)
		if (past.indexOf(ids[i].word) != -1) 
			out.push(withModifier(ids[i], 'ed', word))
		else if (participle.indexOf(ids[i].word) != -1) 
			out.push(withModifier(ids[i], 'pp', word))
	return out;
}
function getBaseForPast(word, ids) {
	var bases = []
	if (/ed$/.test(word)) {
		bases.push(word.slice(0, word.length-1)) // fail-ed
		bases.push(word.slice(0, word.length-2)) // save-d
		if (/ied$/.test(word)) {
			bases.push(word.slice(0, word.length-3)+'y') // sp-ied
		}
		if (/(.)\1ed/.test(word)) {
			bases.push(word.slice(0, word.length-3)) // tap-ped
		}
	} else {
		return []
	}
	var out = []
	for (var i = 0; i < ids.length; i++)
		if (bases.indexOf(ids[i].word) != -1) 
			out.push(withModifier(ids[i], 'ed', word))
	return out;
}
function getBaseForIng(word, ids) {
	var bases = []
	if (/ing$/.test(word)) {
		bases.push(word.slice(0, word.length-3)) // fail-ing
		bases.push(word.slice(0, word.length-3)+'e') // sav-ing
		if (/(.)\1ed/.test(word)) {
			bases.push(word.slice(0, word.length-4)) // tap-ping
		}
	} else {
		return []
	}
	var out = []
	for (var i = 0; i < ids.length; i++)
		if (bases.indexOf(ids[i].word) != -1) 
			out.push(withModifier(ids[i], 'ing', word))
	return out;
}
function withModifier(id, mod, wholeWord) {
	var out = {}
	for (var prop in id) {
		out[prop] = id[prop]
	}
	out.mods = [mod]
	out.wholeWord = wholeWord
	return out
}

IdInput = React.createClass({
	mixins: [ReactFireMixin],
	getDefaultProps: function() {
		return {
			placeholder:'type a word for an id',
		};
	},
	getInitialState: function() {
		return {
			selected: 0,
			allIds: [],
			filter: '',
		};
	},
	componentWillMount: function() {
		this.bindAsObject(firebase.child('ids'), 'allIds');
	},
	updateFilter: function(e) {
		this.setState({filter:e.target.value})
	},
	filteredIds: function() {
		var ids = []
		for (var pagenum in this.state.allIds)
			for (var boxnum in this.state.allIds[pagenum]) 
				ids.push(this.state.allIds[pagenum][boxnum])
		if (this.props.shouldUseCompound) {
			var irregBaseIds = getBaseForIrreg(this.state.filter, ids)
			var pastBaseIds = getBaseForPast(this.state.filter, ids)
			var ingBaseIds = getBaseForIng(this.state.filter, ids)
			ids = ids.concat(pastBaseIds, ingBaseIds, irregBaseIds)
		}
		return ids
			.filter(function(id) {
				return getWordScore(this.state.filter, id) > -Infinity
			}.bind(this))
			.sort(bestId.bind(null, this.state.filter))
			.slice(0, 10)
	},
	handleKeyDown: function(e) {
		if (e.keyCode == 13 /* enter */) {
			this.input()
		} else if (e.keyCode == 27 /* esc */) {
			this.clear()
		} else if (e.keyCode == 40 /* down */) {
			this.select(this.state.selected+1)
		} else if (e.keyCode == 38 /* up */) {
			this.select(this.state.selected-1)
		}
	},
	input: function() {
		this.props.onInput && this.props.onInput(this.filteredIds()[this.state.selected])
		this.clear()
		React.findDOMNode(this.refs.input).focus()
	},
	clear: function() {
		this.setState({filter:'', selected:0})
	},
	select: function(i) {
		var max = this.filteredIds().length-1;
		this.setState({
			selected: i < 0 ? 0 : i > max ? max : i
		})
	},
	render: function() {
		var ids = this.filteredIds();
		return (
			<span className="idInput"> 
				<input
					ref="input"
					autoFocus={this.props.autoFocus}
					placeholder={this.props.placeholder}
					value={this.state.filter} 
					onChange={this.updateFilter} 
					onKeyDown={this.handleKeyDown}
				/>
				<div className="idRowContainer" style={{
						display:ids.length == 0 ? 'none' : ''
					}}>
					{ids.map(function(id, i) {
						return <IdRow 
							id={id} 
							selected={i==this.state.selected}
							onMouseOver={this.select.bind(null, i)}
							onClick={this.input}
							word={id.word}
							key={i}
						/>
					}.bind(this))}
				</div>
			</span>
		);
	}
})

var IdRow = React.createClass({
	render: function() {
		return (
			<div className={'idRow ' + (this.props.selected ? 'selected' : '')}
				   onMouseOver={this.props.onMouseOver}
				   onClick={this.props.onClick}>
				<div><IdImg id={this.props.id} /></div>
				<div>({this.props.id.wholeWord || this.props.word})</div>
			</div>
		);
	}
});