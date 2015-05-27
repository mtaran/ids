Content = React.createClass({
	getDefaultProps: function() {
		return {
			loading:false,
		};
	},
	render: function() {
		return (
			<div className="content">
				<div style={{display: this.props.loading ? 'none' : ''}}>
					{this.props.children}
				</div>
				<div style={{display: this.props.loading ? '' : 'none'}}>
					Loading...
				</div>
			</div>
		)
	}
})