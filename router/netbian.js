
/**
 * 彼岸桌面
 */

var charset = require('superagent-charset'); // 手动改指定网页编码,解决中文乱码问题
var request = require('superagent');
var cheerio = require('cheerio');
var async = require('async'); // 控制并发
var fs = require('fs');
var path = require('path');
var url_model = require('url');
charset(request);

// 壁纸分类
var cate = [
	{
		key: 'fengjing',
		value: '风景'
	},
	{
		key: 'weimei',
		value: '唯美'
	},
	{
		key: 'keai',
		value: '可爱'
	},
	{
		key: 'dongman',
		value: '动漫'
	},
	{
		key: 'dongwu',
		value: '动物'
	},
	{
		key: 'ali',
		value: '阿狸'
	}
];

exports.netbian = function(req, res){
	res.render('netbian/netbian', {
		cate: cate,
		page: 10
	});
};

// 分页
exports.cate_page = function(req, res){

	var cate = req.query.cate;
	var page = req.query.page;
	if(page == 1){
		var url = 'http://www.netbian.com/' + cate + '/index.htm';
	}else{
		var url = 'http://www.netbian.com/' + cate + '/index_' + page + '.htm';
	}
	// 壁纸按栏目+页码存放
	var dir = path.resolve(__dirname, '../wallpaper/', cate, page);
	// 检测目录
	mkdirs(dir);
	down_pic(url, dir, res);
};

// 递归创建目录
var mkdirs = function(dir){
	try{
		var stat = fs.statSync(dir);
	}catch(e){
		mkdirs(path.dirname(dir));
		fs.mkdirSync(dir);
	}
};

/**
 * 下载图片
 * @param  {[type]} url [图片URL]
 * @param  {[type]} dir [存储目录]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
var down_pic = function(url, dir, res){

	var domain = 'http://www.netbian.com'; // 域名

	request
	.get(url)
	.end(function(err, sres){

		var $ = cheerio.load(sres.text);
		var pic_url = []; // 中等图片链接数组
		$('.list ul', 0).find('li').each(function(index, ele){
			var ele = $(ele);
			var href = ele.find('a').eq(0).attr('href'); // 中等图片链接
			if(href != undefined){
				pic_url.push(url_model.resolve(domain, href));
			}
		});

		var count = 0; // 并发计数器
		var wallpaper = []; // 壁纸数组
		var fetchPic = function(_pic_url, callback){

			count++; // 并发加1

			var delay = parseInt((Math.random() * 10000000) % 2000);
			console.log('现在的并发数是:' + count + ', 正在抓取的图片的URL是:' + _pic_url + ' 时间是:' + delay + '毫秒');
			setTimeout(function(){
				// 获取大图链接
				request
				.get(_pic_url)
				.end(function(err, ares){
					var $$ = cheerio.load(ares.text);
					var pic_down = url_model.resolve(domain, $$('.pic-down').find('a').attr('href')); // 大图链接

					count--; // 并发减1

					// 请求大图链接
					request
					.get(pic_down)
					.charset('gbk') // 设置编码, 网页以GBK的方式获取
					.end(function(err, pic_res){

						var $$$ = cheerio.load(pic_res.text);
						var wallpaper_down_url = $$$('#endimg').find('img').attr('src'); // URL
						var wallpaper_down_title = $$$('#endimg').find('img').attr('alt'); // title

						// 下载大图
						request
					    .get(wallpaper_down_url)
					    .end(function(err, img_res){
					    	if(img_res.status == 200){
					    		// 保存图片内容
								fs.writeFile(dir + '/' + wallpaper_down_title + path.extname(path.basename(wallpaper_down_url)), img_res.body, 'binary', function(err){
									if(err) console.log(err);
								});
					    	}
					    });

						wallpaper.push(wallpaper_down_title + '下载完毕<br />');
					});
					callback(null, wallpaper); // 返回数据
				});
			}, delay);
		};

		// 并发为2,下载壁纸
		async.mapLimit(pic_url, 2, function(_pic_url, callback){
			fetchPic(_pic_url, callback);
		}, function (err, result){
			console.log('success');
			res.send(result[0]); // 取下标为0的元素
		});
	});
};


// 获取风景图片
exports.fengjing = function(req, res){

	var url = 'http://www.netbian.com/fengjing/index.htm'; // 风景图片URL
	var dir = 'wallpaper';
	down_pic(url, dir, res);
};
