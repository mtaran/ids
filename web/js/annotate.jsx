// HELPERS

function readLocal(key,defaultVal) {
	if (localStorage.hasOwnProperty("ids/"+key)) {
		return localStorage['ids/'+key]
	}
	else
		return defaultVal
}
function read(key,defaultVal) {
	if (localFire.hasOwnProperty("ids/"+key)) {
		return localFire['ids/'+key]
	}
	if (localStorage.hasOwnProperty("ids/"+key)) {
		return localStorage['ids/'+key]
	}
	return defaultVal
}
function writeLocal(key, val) {
	return localStorage["ids/"+key] = val
}
function write(key, val) {
	if (val == "[]") {
		return; // hack hack hack :D
	}
	firebase.child(key).set(val)
	localStorage["ids/"+key] = val
	return localFire["ids/"+key] = val
}
function list(prefix) {
	return Object.keys(localStorage).concat(Object.keys(localFire))
		.filter(function(key) { return key.startsWith('ids/' + prefix)})
		.map(function(key) { return key.substring(4) })
}
function stringify(num) {
	if (num < 10) return "00"+num
	else if (num < 100) return "0"+num
	return num
}
function range(a,b) {
	var start, end;
	if (b === undefined)	{
		start = 0; end = a;
	} else {
		start = a; end = b;
	}
	var out = [];
	for (var i = start; i < end; i++) {
		out.push(i);
	}
	return out;
}


var dispatcher = new Dispatcher();
var firebase = new Firebase("https://idannotations.firebaseio.com/");
var localFire = {};
firebase.once('value', function(data) {
	function flatten(input) {
		var output = {}
		for (var key in input) {
			var val = input[key]
			if (val instanceof Object) {
				var flattenedVal = flatten(val)
				for (var keyRest in flattenedVal) {
					output[key+'/'+keyRest] = flattenedVal[keyRest]
				}
			} else {
				output[key] = val
			}
		}
		return output
	}
	localFire = flatten({ids: data.val()});
	localCoal = data.val();
	dispatcher.dispatch({type:'pageLoaded'})
})

var PageService = function() {
	this.boxes = {}
	var hashPage = +(window.location.hash.replace(/^#/, '') || 'NaN')
	this.page = isNaN(hashPage) ? +readLocal('page', 0) : hashPage
	this.id = dispatcher.register(function(e) {
		switch (e.type) {
			case 'pageNext':
				return this.startLoadPage(this.page + 1);
			case 'pagePrev':
				return this.startLoadPage(this.page - 1);
			case 'pageLoad':
				return this.startLoadPage(this.page);
			case 'goToPage':
				return this.startLoadPage(e.page);
		}
	}.bind(this))
	$(document).keydown(function(e) {
		switch (e.keyCode) {
			case 37: // left
				return dispatcher.dispatch({type:'pagePrev'})
			case 39: // right
				return dispatcher.dispatch({type:'pageNext'})
		}
	})
}
PageService.prototype.startLoadPage = function(n) {
	$.get('data/boxes'+stringify(n)+'.json', function(data){
		this.page = n
		writeLocal('page', n)
		delete data[0]
		this.boxes[n] = data
		dispatcher.dispatch({type:'pageLoaded'})
	}.bind(this))
}
pageService = new PageService();


annotations = {
	word: {label: 'word'},
	id: {label: 'id'},
	help: {label: 'help'},
	label: {label: 'etc'},
	none: {label: 'none'},
	segment: {label: 'segment'},
}
annotationsOrder = [
	annotations.word, 
	annotations.id, 
	annotations.label,
	annotations.segment,
	annotations.none
]

// UI COMPONENTS

var Main = React.createClass({
	// mixins: [ReactFireMixin],
	getInitialState: function() {
		return {
			page: pageService.page,
			boxes: [],
			annotation: annotations.id,
		}
	},
	componentWillMount: function() {
		dispatcher.register(function(e) {
			switch (e.type) {
				case 'pageLoaded':
				case 'willAddBoxUpdated':
					return this.setState({
						page:pageService.page, 
						boxes:pageService.boxes[pageService.page],
						willAddBox:read('willAddBox', true)
					})
			}
		}.bind(this))
	},
	updateBoxes_: function(page) {
		$.get('data/boxes'+stringify(page)+'.json', function(data){
			delete data[0]
			this.setState({boxes:data})
		}.bind(this))
	},
	componentDidMount: function() {
		dispatcher.dispatch({type:'pageLoad'})
	},
	imgSrc: function(page) {
		if (page <= 0) page = 0
		if (page >= 109) page = 109
		return "data/Image-" + stringify(page) + ".jpg"
	},
	pageNext: function() {
		dispatcher.dispatch({type:'pageNext'})
	},
	pagePrev: function() {
		dispatcher.dispatch({type:'pagePrev'})
	},
	goToPage: function(e) {
		dispatcher.dispatch({type:'goToPage', page:+e.target.value})
	},
	selectAnnotation: function(annotation) {
		this.setState({annotation: annotation})
	},
	changeWillAddBox: function(e) {
		this.setState({willAddBox:e.target.checked})
	},
	render: function() {
		return (
			<div style={Main.style} className={this.state.willAddBox && 'addbox'}>
				<div className="topbar">
					<PageToggle 
						value={this.state.page} 
						handlePrev={this.pagePrev} 
						handleNext={this.pageNext}
						handleGoToPage={this.goToPage} />
					<AnnotationSelector 
						willAddBox={this.state.willAddBox}
						changeWillAddBox={this.changeWillAddBox}
						annotations={annotationsOrder}
						selected={this.state.annotation}
						handleSelect={this.selectAnnotation}/>
				</div>
				<br />
				<br />
				<div className="imageWrapper">
					<img src={this.imgSrc(this.state.page-1)} style={{display:'none'}}/>
					<img src={this.imgSrc(this.state.page)} />
					<img src={this.imgSrc(this.state.page+1)} style={{display:'none'}} />
					<div>
					<Boxes 
						page={this.state.page} 
						boxes={this.state.boxes} 
						willAddBox={this.state.willAddBox}
						currentLabel={this.state.annotation.label}/>
					</div>
					<AddBoxOverlay 
						page={this.state.page} 
						currentLabel={this.state.annotation.label}
						willAddBox={this.state.willAddBox}
					/>
				</div>
				<br /><br /><br /><br /><br /><br /><br /><br /><br />
				<div className="bottombar">
					<PageToggle 
						value={this.state.page} 
						handlePrev={this.pagePrev} 
						handleNext={this.pageNext}
						handleGoToPage={this.goToPage} />
					<AnnotationSelector 
						willAddBox={this.state.willAddBox}
						changeWillAddBox={this.changeWillAddBox}
						annotations={annotationsOrder}
						selected={this.state.annotation}
						handleSelect={this.selectAnnotation}/>
				</div>
			</div>
		)
	}
})
Main.style = {
	fontSize: '30px !important; font-family: sans-serif'
}

var AddBoxOverlay = React.createClass({
	componentWillMount: function() {
		$(document).on('keydown', this.handleKeyDown)
	},
	componentWillReceiveProps: function(newProps) {
		this.setState({boxes:JSON.parse(read('newboxes/'+newProps.page, "[]"))})
	},
	handleKeyDown: function(e) {
		switch (e.keyCode) {
			case 90: // 'z'
				if (this.state.start) {
					return this.setState({start:null, end:null})
				} else {
					return this.setState({boxes:this.state.boxes.slice(0,this.state.boxes.length-1)})
				}
		}
	},
	componentWillUpdate: function(nextProps, nextState) {
		if (nextProps.page != this.props.page) return
		write('newboxes/' + this.props.page, JSON.stringify(nextState.boxes))
	},
	componentWillUnmount: function() {
		$(document).off('keydown', this.handleKeyDown)
	},
	getInitialState: function(e) {
		return {
			start: null,
			size: null,
			boxes: [],
		}
	},
	handleMouseDown: function(e) {
		var offset = $(React.findDOMNode(this)).offset();
		var x = 2*e.pageX - 2*offset.left;
		var y = 2*e.pageY - 2*offset.top;
		this.setState({
			start:{x:x, y:y}, 
			end:{x:x, y:y}
		})
	},
	handleMouseMove: function(e) {
		if (!this.state.start) return;
		var offset = $(React.findDOMNode(this)).offset();
		var x = 2*e.pageX - 2*offset.left;
		var y = 2*e.pageY - 2*offset.top;
		this.setState({
			end:{x:x, y:y}
		})
	},
	handleMouseUp: function(e) {
		if (!this.state.start) return
		var offset = $(React.findDOMNode(this)).offset();
		var x = 2*e.pageX - 2*offset.left;
		var y = 2*e.pageY - 2*offset.top;
		this.setState({
			start:null, 
			end:null,
			boxes:this.state.boxes.concat({
				top:Math.min(this.state.start.y, y),
				left:Math.min(this.state.start.x, x),
				height:Math.abs(this.state.start.y - y),
				width:Math.abs(this.state.start.x - x),
				label:this.props.currentLabel
			})
		})
	},
	removeNthBox: function(n) {
		var newBoxes = [];
		for (var i = 0; i < this.state.boxes.length; i++) {
			if (i == n) continue;
			newBoxes.push(this.state.boxes[i])
		}
		this.setState({boxes:newBoxes})
	},
	render: function() {
		return <div className="AddBoxOverlay"
			style={{
				position:'absolute', 
				left:0, 
				top:0, 
				width:1275*2, 
				height:1650*2,
				display: this.props.willAddBox ? '' : 'none'
			}} 
			onMouseDown={this.handleMouseDown}
			onMouseMove={this.handleMouseMove}
			onMouseUp={this.handleMouseUp}
			>
			{this.state.start && <Box 
				top={Math.min(this.state.start.y, this.state.end.y)}
				left={Math.min(this.state.start.x, this.state.end.x)}
				height={Math.abs(this.state.start.y - this.state.end.y)}
				width={Math.abs(this.state.start.x - this.state.end.x)}
				annotation={this.props.currentLabel}
				className="added"
			/>}
			{this.state.boxes.map(function(box, i) {
				return <Box 
					top={box.top} 
					left={box.left} 
					height={box.height} 
					width={box.width} 
					annotation={box.label}
					key={i}
					n={i}
					handleClick={this.removeNthBox}
					className="added" 
				/>
			}.bind(this))}
		</div>
	}
})

var Boxes = React.createClass({
	getInitialState: function() {
		return this.readBoxes(this.props.page)
	},
	componentWillReceiveProps: function(nextProps) {
		this.replaceState(this.readBoxes(nextProps.page))
	},
	readBoxes: function(page) {
		var boxes = {}
		list('annotation/' + page + '/').forEach(function(key) {
			var parts = key.split('/')
			boxes[parts[2]] = read(key)
		})
		return boxes;
	},
	annotate: function(key) {
		if (this.props.willAddBox) {
			return;
		}
		var state = {}
		state[key] = this.props.currentLabel
		this.setState(state)
		write('annotation/' + this.props.page + '/' + key, this.props.currentLabel)
	},
	render: function() {
		return (<div>
			{Object.keys(this.props.boxes).map(function(i) {
				var json = this.props.boxes[i]
				var annotation = read('annotation/' + this.props.page + '/' + i, '')
				return (<Box 
					top={json.top} 
					left={json.left}
					height={json.bottom - json.top}
					width={json.right - json.left} 
					annotation={this.state[i]}
					handleClick={this.annotate}
					n={i}

					key={i}
				/>)
			}.bind(this))}
		</div>)
	}
})

var Box = React.createClass({
	handleClick: function() {
		this.props.handleClick(this.props.n)
	},
	render: function() {
		var style = {
			top: this.props.top,
			left: this.props.left,
			height: this.props.height,
			width: this.props.width,
		}
		return <div 
			style={style} 
			className={'annotationBox ' + this.props.annotation + ' ' + this.props.className}
			onClick={this.handleClick}
		/>
	}
})


var PageToggle = React.createClass({
	getInitialState: function() {
		return {page:this.props.value}
	},
	componentWillReceiveProps: function(nextProps) {
		this.setState({page:nextProps.value})
	},
	render: function() {
		return (
			<span>
				<button className="pageButton" onClick={this.props.handlePrev}>&lt;</button>
				<button className="pageButton" onClick={this.props.handleNext}>&gt;</button>
				<select
					value={this.state.page} 
					onChange={this.props.handleGoToPage}>
					{range(110).map(function(i) {
						return <option value={i} key={i}>{i}</option>
					}.bind(this))}
				</select>
			</span>
		)
	},
})

var AnnotationSelector = React.createClass({
	handleModeChange: function(e) {
		write('willAddBox', e.target.checked)
		Main.setState({willAddBox:e.target.checked})
	},
	render: function() {
		return (
			<span className="annotationSelector">
				{this.props.annotations.map(function(annotation) {
					return <AnnotationButton 
						label={annotation.label} 
						selected={this.props.selected == annotation}
						handleClick={this.props.handleSelect.bind(null, annotation)} 

						key={annotation.label}
					/>
				}.bind(this))}
				<label>
					<input 
						type="checkbox" 
						checked={this.props.willAddBox}
						onChange={this.props.changeWillAddBox} />
					create new boxes
				</label>
			</span>
		)
	}
})

var AnnotationButton = React.createClass({
	render: function() {
		var selected = this.props.selected ? ' selected' : ''
		return (
			<span className={"annotationButton " + this.props.label + selected} 
				onClick={this.props.handleClick}>
				{this.props.label}
			</span>
		)
	}
})


React.render(
  <Main />,
  document.getElementById('top')
);