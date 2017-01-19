
// 载入模块
var express = require('express');
var app = express();
var router = require('./router/router');

// 设置模板引擎
app.set('view engine', 'ejs');

// 静态资源中间件
app.use(express.static('./public'));

// 博客园
app.get('/cnblogs', router.cnblogs);
// 栏目
app.get('/cnblogs/cate/:cate/', router.cnblogs_cate);
// 用户
app.get('/cnblogs/user/:user/', router.cnblogs_user);

app.get('/cnblogs/cate', router.cate);
app.get('/cnblogs/cate_page', router.cate_page);

app.listen(1314, function(err){
	if(err) console.log('1314端口被占用');
});
