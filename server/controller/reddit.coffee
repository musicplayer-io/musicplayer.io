req = require 'request'
seo = require './seo'
_ = require 'lodash'

yaml = require 'js-yaml'
path = require 'path'
fs = require 'fs'

subs = yaml.safeLoad fs.readFileSync(path.join(__dirname, '..', '..', '/subreddits.yaml'), 'utf8')



# Reddit controller
# Serves subreddits, comment threads, multireddits
class RedditController
	withSubreddits: (request, response, callback) ->
		subreddits = request.params.subreddit.split('+')
		data = {subreddits: subreddits}
		data.autoplay = true if request.query.autoplay?
		data.user = request.user._json if request.user?
		data.page = 'subreddits'
		if subreddits.length > 1
			data.title = subreddits.join(', ')
			response.render 'app', data
		else
			sub = subreddits[0].toLowerCase()
			matchedSub = _.find subs, (s) -> s.name.toLowerCase() is sub.toLowerCase()
			if matchedSub

				if matchedSub.description?
					data.description = matchedSub.description
				else if matchedSub.header_title?
					data.description = matchedSub.header_title
				else if matchedSub.title?
					data.description = matchedSub.title
				else
					data.description = matchedSub.name

				if matchedSub.title?
					data.title = matchedSub.title
				else
					data.title = matchedSub.name

				data.image = matchedSub.header_img if matchedSub.header_img?
				response.render 'app', data
			else
				data.title = sub
				return response.render 'app', data
	commentThread: (request, response, callback) =>
		comment = 'r/' + request.params.subreddit + '/comments/' + request.params.commentid
		data = {comment: comment}
		data.autoplay = true if request.query.autoplay?
		@render request, response, data, 'comments'
	multiReddit: (request, response, callback) =>
		data = {multi: request.params[0]}
		data.autoplay = true if request.query.autoplay?
		@render request, response, data, 'multi'
	render: (request, response, data, page) ->
		data.user = request.user._json if request.user?
		data.user_json = JSON.stringify(request.user._json) if request.user?
		data.seo = seo.generate page
		data.page = page
		response.render 'app', data



controller = new RedditController
module.exports = controller
