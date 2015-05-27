var firebase = new Firebase("https://idannotations.firebaseio.com/");
Main = React.createClass({
	getInitialState: function() {
		return {
			message: [],
			token: null,
			saved: false,
		};
	},
	addId: function(id) {
		this.setState({message:this.state.message.concat(id), saved:false})
	},
	saveMessage: function() {
		var token = firebase.child('messages').push({
			ids:this.state.message,
			created:Date.now(),
		}).key()
		this.setState({token: token, saved: true})
	},
	render: function() {
		return (
			<div>
				<TopBar>
					
				</TopBar>
				<Content>
					<div className="message">
						{this.state.message.map(function(id, i) {
							return <IdImg id={id} key={i}/>
						})}
					</div>
					<IdInput onInput={this.addId} shouldUseCompound/>
					{this.state.message.length != 0 && 
						<button onClick={this.saveMessage}>save</button>
					}
					{this.state.token &&
						<div>
							message <a href={'/read.html#' + this.state.token}>{this.state.token}</a> saved!
						</div>
					}
				</Content>
			</div>
		)
	}
})


React.render(
	<Main />,
	document.getElementById('top')
);