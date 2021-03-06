/*
 * These functions all save some type of metadata about an id to firebase.
 */

function setWord(id, word) {
	firebase.child('ids').child(id.pagenum).child(id.boxnum).child('word').set(word)
}
function setIssues(id, issues) {
	firebase.child('issues').child(id.pagenum).child(id.boxnum).set(issues)
}
function setExtras(id, extras) {
	firebase.child('extras').child(id.pagenum).child(id.boxnum).set(extras)
}
function setComponents(id, components) {
	firebase.child('components').child(id.pagenum).child(id.boxnum).set(components)
}
function setPos(id, pos, val) {
	firebase.child('pos').child(id.pagenum).child(id.boxnum).child(pos).set(val)
}
function setPriority(id, val) {
	firebase.child('priority').child(id.pagenum).child(id.boxnum).set(val)
}
function setDisambig(id, val) {
	firebase.child('disambig').child(id.pagenum).child(id.boxnum).set(val)
}

/**
 * Component that renders a picture of an id. On click toggles a menu with some
 * editable fields like definition, part of speech, etc.
 */
var IdImg = React.createClass({
	propTypes: {
		id: React.PropTypes.object.isRequired,
		// Optional callback to respond to the user closing the details menu.
		onRemove: React.PropTypes.func,
	},
	mixins:[ReactFireMixin],
	getInitialState: function() {
		return {
			hasMenu: false,
			priority: null,
		};
	},
	componentWillMount: function(nextProps) {
		this.bindAsObject(firebase
			.child('priority')
			.child(this.props.id.pagenum)
			.child(this.props.id.boxnum),
			'priority')
	},
	handleClick: function(e) {
		if (!e.button == 0) return;
		if (this.state.hasMenu) {
			this.closeMenu()
		} else {
			this.openMenu()
		}
	},
	openMenu: function(e) {
		this.setState({hasMenu:true})
	},
	closeMenu: function() {
		this.setState({hasMenu:false})
	},
	/**
	 * Makes the menu close itself when the user clicks off of it.
	 */
	componentWillUpdate: function(nextProps, nextState) {
		if (nextState.hasMenu) {
			var handler = function(event) {
				if (!$.contains(document, event.target)) return;
				if (!this.isMounted()) {
					$(document.body).off('click', handler);
					return
				}
				if (!$(event.target).closest(React.findDOMNode(this)).length) {
					this.closeMenu()
					$(document.body).off('click', handler)
				}
			}.bind(this)
			$(document).click(handler)
		}
	},
	render: function() {
		var id = this.props.id;
		return (
			<span className={this.props.id.mods && this.props.id.mods.indexOf('ed') != -1 ?
				'stackedId' : ''}>
				{this.props.id.mods && this.props.id.mods.indexOf('ed') != -1 &&
					<span className="id p17-912"/>
				}
				{this.props.id.mods && this.props.id.mods.indexOf('pp') != -1 &&
					<span className="id p10-908"/>
				}
				<span className={'id p' + id.pagenum + '-' + id.boxnum + 
					(this.state.hasMenu ? ' withMenu' : '') +
				  (this.state.priority == 'deprecated' ? ' deprecated' : '')} 
					style={{display:id.pagenum != null && id.boxnum != null ? '' : 'none'}}
					onClick={this.handleClick}
				/>
				{this.props.id.mods && this.props.id.mods.indexOf('ing') != -1 &&
					<span className="id p50-123"/>
				}
				{this.state.hasMenu && 
					<IdMenu id={id} close={this.closeMenu} onRemove={this.props.onRemove}/>}
			</span>
		)
	}
})

/**
 * An IdImg component, except one that |pagenum| and |boxnum| instead of an |id| 
 * prop, and then asynchronously fetches the id from firebase.
 */
var IdImgFire = React.createClass({
	propTypes: {
		id: React.PropTypes.object.isRequired,
		// Optional callback to respond to the user closing the details menu.
		onRemove: React.PropTypes.func,
	},
	mixins:[ReactFireMixin],
	getInitialState: function() {
		return {
			id: null,
		};
	},
	componentWillMount: function(nextProps) {
		this.bindAsObject(firebase
			.child('ids')
			.child(this.props.pagenum)
			.child(this.props.boxnum),
			'id')
	},
	render: function() {
		return (
			<div>
				{this.state.id && 
					<IdImg id={this.state.id} onRemove={this.props.onRemove}/>
				}
			</div>
		)
	}
})

/**
 * Input component which lets one add an 'extra', i.e. a component of an id that
 * isn't a standalone id itself.
 */
var ExtraInput = React.createClass({
	propTypes: {
		onInput: React.PropTypes.func.isRequired,
		placeholder: React.PropTypes.string,
	},
	mixins: [ReactFireMixin],
	getInitialState: function() {
		return {
			filter: '',
			extras: null,
			selected: 0,
		};
	},
	componentWillMount: function() {
		this.bindAsArray(firebase.child('extras'), 'extras')
	},
	updateFilter: function(e) {
		this.setState({filter:e.target.value})
	},
	input: function(e) {
		var extra = e.target.value.trim()
		this.props.onInput && this.props.onInput(extra)
		this.clear()
	},
	clear: function(e) {
		this.setState({filter:'', selected: 0})
	},
	handleKeyDown: function(e) {
		if (e.keyCode == 13 /* enter */) {
			this.input(e)
		}
	},
	render: function() {
		return (
			<div className="extraInput">
				<input 
					ref="newExtra" 
					value={this.state.filter} 
					onChange={this.updateFilter}
					onKeyDown={this.handleKeyDown}
					placeholder={this.props.placeholder}
				/>
				<div className="choices">
					{this.getFilteredExtras().map(function(extra) {
						<div key={extra}>{extra}</div>
					})}
				</div>
			</div>
		);
	}
})

/**
 * Simple component displaying a single 'extra' (a component of an id that isn't
 * itslef an id).
 */
var Extra = React.createClass({
	render: function() {
		return (
			<div className="extra">
				{this.props.extra}
				<div className="remove" onClick={this.props.onRemove}>×</div>
			</div>
		);
	}
})

/**
 * Component showing a menu for an id, shows the definition, component ids, etc.
 */
var IdMenu = React.createClass({
	propTypes: {
		id: React.PropTypes.object.isRequired,
		// When called, closes this id menu.
		close: React.PropTypes.func,
		// Optional callback to respond to the user closing the details menu.
		onRemove: React.PropTypes.func,
	},
	mixins: [ReactFireMixin],
	getInitialState: function() {
		return {
			issues: null,
			components: null,
			pos: null,
			priority: null,
			disambig: null,
		};
	},
	componentWillMount: function() {
		this.bindAsObject(firebase
			.child('issues')
			.child(this.props.id.pagenum)
			.child(this.props.id.boxnum), 
			'issues');
		this.bindAsObject(firebase
			.child('components')
			.child(this.props.id.pagenum)
			.child(this.props.id.boxnum), 
			'components');
		this.bindAsObject(firebase
			.child('extras')
			.child(this.props.id.pagenum)
			.child(this.props.id.boxnum), 
			'extras');
		this.bindAsObject(firebase
			.child('pos')
			.child(this.props.id.pagenum)
			.child(this.props.id.boxnum), 
			'pos');
		this.bindAsObject(firebase
			.child('priority')
			.child(this.props.id.pagenum)
			.child(this.props.id.boxnum), 
			'priority');
		this.bindAsObject(firebase
			.child('disambig')
			.child(this.props.id.pagenum)
			.child(this.props.id.boxnum), 
			'disambig');
	},
	/**
	 * Sets the english word on this id to the value of the input that the given
	 * input event just came from.
	 */
	moveToWord: function(e) {
		e.preventDefault()
		var newWord = React.findDOMNode(this.refs.newWord).value.trim();
		setWord(this.props.id, newWord)
		this.props.close()
	},
	/**
	 * Adds an 'issue' (problem with the id) to this id, using the value of the
	 * elment that generated the passed-in input event.
	 */
	addIssue: function(e) {
		e.preventDefault()
		var newIssueEl = React.findDOMNode(this.refs.newIssue);
		var newIssue = newIssueEl.value.trim();
		setIssues(this.props.id, (this.state.issues||[]).concat({text:newIssue}))
		newIssueEl.value = ''
	},
	/**
	 * Removes the issues at index `num` from this id.
	 */
	removeIssue: function(num) {
		var newIssues = []
		for (var i = 0; i < this.state.issues.length; i++)
			if (i != num)
				newIssues.push(this.state.issues[i])
		setIssues(this.props.id, newIssues)
	},
	/**
	 * Adds an 'extra' (component of an id that isn't itself a component) to this
	 * id.
	 * @param {string} newExtra
	 */
	addExtra: function(newExtra) {
		function eqToExtra(extra) {
			return extra == newExtra
		}
		if (this.state.extras && this.state.extras.some(eqToExtra)) return
		setExtras(this.props.id, (this.state.extras||[]).concat(newExtra))
	},
	/**
	 * Removes the 'extra' (component of an id that isn't itself a component) at
	 * the given index from this id.
	 */
	removeExtra: function(num) {
		var newExtras = []
		for (var i = 0; i < this.state.extras.length; i++)
			if (i != num)
				newExtras.push(this.state.extras[i])
		setExtras(this.props.id, newExtras)
	},
	/**
	 * Adds a component id to this id.
	 * @param {Id} component
	 */
	addComponent: function(component) {
		function eqToComponent(comp) {
			return comp.pagenum == component.pagenum && comp.boxnum == component.boxnum
		}
		if (this.state.components && this.state.components.some(eqToComponent)) return
		setComponents(this.props.id, (this.state.components||[]).concat({
			pagenum:component.pagenum,
			boxnum:component.boxnum
		}))
	},
	/**
	 * Removes the subcomponent at the given index from this id.
	 */
	removeComponent: function(num) {
		var newComponents = []
		for (var i = 0; i < this.state.components.length; i++)
			if (i != num)
				newComponents.push(this.state.components[i])
		setComponents(this.props.id, newComponents)
	},
	/**
	 * Sets the part of speech on this id. 
	 */
	updatePos: function(pos, e) {
		setPos(this.props.id, pos, e.target.checked)
	},
	/**
	 * Sets the priority on this id, to be used for showing higher priority ids
	 * earlier within the group of ids corresponding to a single written word.
	 */
	updatePriority: function(pos, e) {
		setPriority(this.props.id, e.target.checked ? pos : '')
	},
	/**
	 * Sets the disambiguation text, used for differentiating between different
	 * ids that correspond to different meanings of a single written word form.
	 */
	updateDisambig: function(e) {
		setDisambig(this.props.id, e.target.value)
	},
	render: function() {
		return (
			<div className="idMenu">
				<div>
					id <a href={'/#'+this.props.id.pagenum}>
						{this.props.id.pagenum}.{this.props.id.boxnum}
					</a>
					{this.props.onRemove && 
						<div className="remove" onClick={this.props.onRemove}>×</div>}
				</div>
				<div>{this.props.id.word}</div>
				<form onSubmit={this.moveToWord}>
					<input 
					  ref="newWord" 
					  placeholder="change word"/>
				</form>
				<IdInput onInput={this.addComponent} placeholder="add component" autoFocus/>
				{this.state.components &&
					<div className="components">
						{this.state.components.map(function(id, i) {
							return (
								<IdImgFire 
									pagenum={id.pagenum} 
									boxnum={id.boxnum} 
									key={id.pagenum+'.'+id.boxnum}
									onRemove={this.removeComponent.bind(null, i)}
								/>
							)
						}.bind(this))}
					</div>
				}
				<ExtraInput onInput={this.addExtra} placeholder="add extra part"/>
				{this.state.extras && 
					<div className="extras">
						{this.state.extras.map(function(extra, i) {
							return <Extra extra={extra} key={extra} onRemove={this.removeExtra.bind(null, i)} />
						}.bind(this))}
					</div>
				}
				<div className="partOfSpeech">
					<label>
						<input type="checkbox" 
							checked={this.state.pos && this.state.pos.noun} 
							title="noun"
							onChange={this.updatePos.bind(this, 'noun')}
						/>N</label>
					<label>
						<input type="checkbox" 
							checked={this.state.pos && this.state.pos.verb} 
							title="verb"
							onChange={this.updatePos.bind(this, 'verb')}
						/>V</label>
					<label>
						<input type="checkbox" 
							checked={this.state.pos && this.state.pos.adjective} 
							title="adjective"
							onChange={this.updatePos.bind(this, 'adjective')}
						/>A</label>
				</div>
				<div className="priority">
					<label>
						<input type="checkbox" name="priority"
							checked={this.state.priority == 'deprecated'} 
							title="adjective"
							onChange={this.updatePriority.bind(this, 'deprecated')}
						/>deprecated</label>
				</div>
				<input 
					value={this.state.disambig} 
					onChange={this.updateDisambig} 
					placeholder="disambiguation"
				/>
				<form onSubmit={this.addIssue}>
					<input ref="newIssue" 
						placeholder={this.state.issues && this.state.issues.length > 0 ? 
							'add issue' : 'report issue'}/>
				</form>
				{this.state.issues &&
					this.state.issues.map(function(issue, i) {
						return (
							<div className="issue" key={i}>
								{issue.text}
								<div><button onClick={this.removeIssue.bind(null, i)}>×</button></div>
							</div>
						)
					}.bind(this))
				}
			</div>
		);
	}
})