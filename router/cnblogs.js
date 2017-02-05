
/**
 * 博客园
 */

var request = require('superagent');
var cheerio = require('cheerio');
var async = require('async'); // 控制并发
var fs = require('fs');
var path = require('path');

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
	res.render('cnblogs/cnblogs', {
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

// 栏目分页
exports.cate = function(req, res){
	res.render('cnblogs/cate', {
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


// 获取用户头像
exports.avater = function(req, res){

	// 积分排名前3000用户信息
	var url = 'http://www.cnblogs.com/AllBloggers.aspx';
	request
	.get(url)
	.end(function(err, sres){

		var $ = cheerio.load(sres.text);
		var user = [];
		$('table').eq(1).find('td').each(function(index, ele){
			var ele = $(ele);
			/***
			user.push({
				'username': ele.find('a').eq(0).text(), // 用户名
				'blogurl':  ele.find('a').eq(0).attr('href'), // 博客URL
			});
			***/
			// 用户主页URL(暂时获取前10名)
			if(index < 10) 
				user.push(ele.find('a').eq(0).attr('href'));
		});

		var count = 0;
		var avater = [];
		var fetchAvater = function(homeurl, callback){

			// 从 http://www.cnblogs.com/slion/ 中截取 slion 
			var delimiter = '.com'; // 截取字符串
			var username = homeurl.slice((homeurl.indexOf(delimiter) + delimiter.length + 1), -1);
			var blogurl = 'https://home.cnblogs.com/u/' + username; // 博客主页

			count++; // 并发加1

			var delay = parseInt((Math.random() * 10000000) % 2000);
			console.log('现在的并发数是:' + count + ', 正在抓取的数据的URL是:' + blogurl + ' 时间是:' + delay + '毫秒');
			setTimeout(function(){
				// 请求博客主页
				request
				.get(blogurl)
				.end(function(err, ares){
					var $$ = cheerio.load(ares.text);
					// 头像URL地址
					var img_url = 'https:' + $$('.img_avatar').attr('src');

					// https://home.cnblogs.com/u/lhb25  处理头像连接带参数的情况
					if(img_url.indexOf('?') != -1){
						img_url = img_url.slice(0, img_url.indexOf('?'));
					}
					
					count--; // 完成请求,并发数减1

					// 跳过默认头像,只抓取上传了头像的用户
					if(img_url.indexOf('simple_avatar.gif') == -1){
						avater.push(img_url);

						// 请求图片内容
						request
					    .get(img_url)
					    //.set("X-Forwarded-For" , "42.121.252.58") // 伪造来源
					    .end(function(err, img_res){
					    	if(img_res.status == 200){
					    		// 保存图片内容
								fs.writeFile('./avater/' + username + path.extname(path.basename(img_url)), img_res.body, 'binary', function(err){
									if(err) console.log(err);
								});
					    	}
					    });
					}
					callback(null, avater); // 返回数据
				});
			}, delay);
		};
		
		// 并发数为2
		async.mapLimit(user, 2, function(homeurl, callback){
			fetchAvater(homeurl, callback);
		}, function (err, result){
			console.log('success');
			res.json({
				avater: result[0] // 取下标为0的元素
			});
		});
	});
};


