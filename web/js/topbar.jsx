TopBar = React.createClass({
	render: function() {
		return (
			<div className="topBar">
				{this.props.children}
			</div>
		)
	}
})