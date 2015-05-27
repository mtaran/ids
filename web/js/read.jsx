var firebase = new Firebase("https://idannotations.firebaseio.com/");
Main = React.createClass({
	mixins:[ReactFireMixin],
	getInitialState: function() {
		return {
			message: undefined,
		};
	},
	bindToHash: function() {
		var messageKey = window.location.hash.replace(/^#/, '')
		this.bindAsObject(firebase.child('messages').child(messageKey), 'message')
	},
	componentWillMount: function() {
		this.bindToHash()
		$(window).on('hashchange', this.bindToHash)
	},
	componentWillUnmount: function() {
		$(window).off('hashchange')
	},
	render: function() {
		return (
			<div>
				<TopBar />
				<Content loading={this.state.message === undefined}>
					<div className="message">
						{this.state.message && this.state.message.ids && this.state.message.ids
							.map(function(id, i) {
								return <IdImg id={id} key={i}/>
							})}
					</div>
					<div>
						message created at {Date(this.state.message && this.state.message.created)}
					</div>
				</Content>
			</div>
		)
	}
})


React.render(
	<Main />,
	document.getElementById('top')
);