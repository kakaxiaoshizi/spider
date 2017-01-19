
var request = require('superagent');
var cheerio = require('cheerio');

// 栏目
var cate = [
	'java', 'cpp', 'php', 'delphi', 'python', 'ruby',
	'web', 'javascript', 'jquery', 'html5'
];
// 作者
var author = [
	'lianmin', 'coco1s'
];

exports.cnblogs = function(req, res){
	res.render('cnblogs', {
		cate: cate,
		author, author
	});
};

exports.cnblogs_cate = function(req, res){

	// 栏目
	var cate = req.params['cate'];

	request
	.get('http://www.cnblogs.com/cate/' + cate)
	.end(function(err, sres){

		var $ = cheerio.load(sres.text);
		var article = [];
		$('.titlelnk').each(function(index, ele){
			var ele = $(ele);
			var href = ele.attr('href'); // 博客链接
			var title = ele.text();      // 博客内容
			article.push({
				href: href,
				title: title
			});			
		});
		res.json({
			title: cate,
			cnblogs: article
		});
	});
};

exports.cnblogs_user = function(req, res){

	// 作者
	var user = req.params['user'];

	request
	.get('http://www.cnblogs.com/' + user)
	.end(function(err, sres){

		var $ = cheerio.load(sres.text);

		// 作者
		var author = $('#Header1_HeaderTitle').text();
		// 标签
		var tag = $('#tagline').text();

		var article = [];
		$('.postTitle').each(function(index, ele){
			var ele = $(ele);
			var a = ele.find('a').eq(0);
			article.push({
				href: a.attr('href'),
				title: a.text()
			});
		});
		res.json({
			author: author,
			tag: tag,
			cnblogs: article
		});
	});
};


exports.cate = function(req, res){
	res.render('cate', {
		cate: cate
	});
};

// 分页
exports.cate_page = function(req, res){

	var cate = req.query.cate;
	var page = req.query.page;

	var url = 'http://www.cnblogs.com/cate/' + cate;

	request
	.get(url)
	.end(function(err, sres){

		// 构造POST请求的参数
		var $ = cheerio.load(sres.text);
		var post_data_str = $('#pager_bottom').prev().html().trim();
		var post_data_obj = JSON.parse(post_data_str.slice(post_data_str.indexOf('=')+2, -1));	

		// 分页接口
		var page_url = 'http://www.cnblogs.com/mvc/AggSite/PostList.aspx';
		// 修改当前页
		post_data_obj.PageIndex = page; 

		request
		.post(page_url)
		.set('origin', 'http://www.cnblogs.com') // 伪造来源
		.set('referer', 'http://www.cnblogs.com/cate/'+cate+'/') // 伪造referer
		.send(post_data_obj) // POST数据
		.end(function(err, ssres){
			var article = [];
			var $$ = cheerio.load(ssres.text);
			$$('.titlelnk').each(function(index, ele){
				var ele = $$(ele);
				var href = ele.attr('href');
				var title = ele.text();
				article.push({
					href: href,
					title: title
				});			
			});
			res.json({
				title: cate,
				cnblogs: article
			});
		});	
	});
};

