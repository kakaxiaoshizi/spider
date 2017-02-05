
// 载入模块
var express = require('express');
var app = express();
var cnblogs = require('./router/cnblogs');
var netbian = require('./router/netbian');

// 设置模板引擎
app.set('view engine', 'ejs');

// 静态资源中间件
app.use(express.static('./public'));

// 博客园
app.get('/cnblogs', cnblogs.cnblogs);
// 栏目(第1页)
app.get('/cnblogs/cate/:cate/', cnblogs.cnblogs_cate);
// 用户(第1页)
app.get('/cnblogs/user/:user/', cnblogs.cnblogs_user);

// 栏目分页
app.get('/cnblogs/cate', cnblogs.cate);
app.get('/cnblogs/cate_page', cnblogs.cate_page);

// 获取博客园积分排名前3000的用户头像
app.get('/avater', cnblogs.avater);


// 彼岸桌面
app.get('/netbian', netbian.netbian);
app.get('/netbian/cate_page', netbian.cate_page);
app.get('/fengjing', netbian.fengjing);


app.listen(1314, function(err){
	if(err) console.log('1314端口被占用');
});
