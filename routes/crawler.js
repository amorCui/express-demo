var express = require('express');
var router = express.Router();
var http = require('http');
var https = require('https');
var cheerio = require('cheerio');
var zlib = require('zlib');

/**
 * 爬虫页面
 */
router.get('/',function(req, res, next){
    res.render('crawler', { title: '爬虫' });
});

router.get('/getMessage',function(req,res,next){
    var page = req.param('page');
    var defaultUrl = 'www.zhipin.com/c101020100-p100901/b_%E6%B5%A6%E4%B8%9C%E6%96%B0%E5%8C%BA/?page=' + page + '&ka=page-' + page;
    var hostname = 'www.zhipin.com';
    var path = '/c101020100-p100901/b_%E6%B5%A6%E4%B8%9C%E6%96%B0%E5%8C%BA/?page=' + page + '&ka=page-' + page;;
    var Res = res;
    var url = req.param('url')?req.param('url'):defaultUrl;




    //https
    var options = {
        hostname: hostname,
        port: 443,
        path: path,
        method: 'GET',
        headers: {
            'accept-encoding':'gzip, deflate, br',
            'cache-control':'max-age=0',
            'upgrade-insecure-requests':1,
            'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language':'zh-CN,zh;q=0.8',
            'Connection':'keep-alive',
            'cookie':'lastCity=101020100; __g=-; _uab_collina=155222357948113410835643; __c=1552223584; JSESSIONID=""; toUrl=https%3A%2F%2Fwww.zhipin.com%2Fc101020100-p100901%2Fb_%25E6%25B5%25A6%25E4%25B8%259C%25E6%2596%25B0%25E5%258C%25BA%2F%3Fpage%3D3%26ka%3Dpage-3; __l=r=https%3A%2F%2Fwww.zhipin.com%2F&l=%2Fwww.zhipin.com%2Fc101020100-p100901%2F; __a=81322544.1552223576.1552223576.1552223584.14.2.13.14; Hm_lvt_194df3105ad7148dcf2b98a91b5e727a=1552223580; Hm_lpvt_194df3105ad7148dcf2b98a91b5e727a=1552234824',
            'User-Agent':'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 UBrowser/6.2.4094.1 Safari/537.36'
        }
    };

    // console.log('options:',options);


    var req = https.get(options,function(res){
        const { statusCode } = res;
        const contentType = res.headers['content-type'];
        // console.log('contentType:',contentType);
        let error;
        if (statusCode !== 200) {
            error = new Error('Request Failed.\n' +
                            `Status Code: ${statusCode}`);
        }
        if (error) {
            console.error(error.message);
            // consume response data to free up memory
            res.resume();
            return;
        }
        // res.setEncoding('utf-8');
    
        // console.log("response.headers['content-encoding']:",res.headers['content-encoding']);
        var encoding = res.headers['content-encoding'];
        var chunks = [];
        // 非gzip/deflate要转成utf-8格式
        if( encoding === 'undefined'){
            res.setEncoding('utf-8'); 
        }
        res.on('data', (chunk) => { 
            chunks.push(chunk);

        });
        res.on('end', () => {
            try {
                var buffer = Buffer.concat(chunks);
                var data;
                // console.log('==>encoding \n', encoding);
            

                getData(Res,data,encoding,buffer,makeJsonData);

                // console.log('==>buffer \n', buffer);
                // if (encoding == 'gzip') {
                //     zlib.gunzip(buffer, function (err, decoded) {
                //         data = decoded.toString();
                //         // callback( err, args, res.headers, data); 
                //     });
                // } else if (encoding == 'deflate') {
                //     zlib.inflate(buffer, function (err, decoded) {
                //         data = decoded.toString();
                //         // callback( err, args, res.headers, data); 
                //     });
                // } else {
                //     data = buffer.toString();
                //     // callback( null, args, res.headers, data);
                // } 
                
                // console.log(parsedData);
            } catch (e) {
                console.error(e.message);
            }
        });

        // getResponse(res,Res);
    })
    .on('error', function (e) {
        console.log(' into error function!!!!');
        console.log(new Error('problem with request: ' + e.message));
        req.end();
        // setTimeout(cb, 10);
    });

    // req.write(reqdata);
    // req.on('response', function (response) {
    //     switch (response.headers['content-encoding']) {
    //         case 'gzip':
    //             var body = '';
    //             var gunzip = zlib.createGunzip();
    //             response.pipe(gunzip);
    //             gunzip.on('data', function (data) {
    //                 body += data;
    //             });
    //             gunzip.on('end', function () {
    //                 var returndatatojson= JSON.parse(body);
    //                 req.end();
    //             });
    //             gunzip.on('error', function (e) {
    //                 console.log('error' + e.toString());
    //                 req.end();
    //             });
    //             break;
    //         case 'deflate':
    //             // var output = fs.createWriteStream("d:temp.txt");
    //             response.pipe(zlib.createInflate()).pipe(output);
    //             req.end();
    //             break;
    //         default:req.end();
    //             break;
    //     }
    // });



    //http
    // http.get(url,function(res){
        // getResponse(res);
    // });


});


function getData(res,data,encoding,buffer,callback){
    console.log('into getData function');

    if (encoding == 'gzip') {
        zlib.gunzip(buffer, function (err, decoded) {
            data = decoded.toString();
            // callback( err, args, res.headers, data); 
            callback(data,res);
        });
    } else if (encoding == 'deflate') {
        zlib.inflate(buffer, function (err, decoded) {
            data = decoded.toString();
            // callback( err, args, res.headers, data); 
            callback(data,res);
        });
    } else {
        data = buffer.toString();
        // callback( null, args, res.headers, data);
        callback(data,res);
    } 
    
    return data;
}

function makeJsonData(data,Res){
    console.log('cheerio模块开始处理 DOM处理');

    var $ = cheerio.load(data); //cheerio模块开始处理 DOM处理
    var jobs = [];
    console.log('开始获取dom节点');

    var jobs_list = $(".job-list .job-primary");
    // console.log('jobs_list:',jobs_list.html());
    console.log('jobs_list-->length:',jobs_list.length);
    jobs_list.each(function(){   //对页面岗位栏信息进行处理  每个岗位对应一个 li  ,各标识符到页面进行分析得出
        var job = {};
        job.name = $(this).find('.info-primary .name .job-title').html();//岗位名
        job.wages = $(this).find('.info-primary .name .red').html();//工资
        job.company = $(this).find(".info-company .name").find("a").html(); //公司名


        
        // job.period = $(this).find(".hot_pos_r span").eq(1).html(); //阶段
        // job.scale = $(this).find(".hot_pos_r span").eq(2).html(); //规模

        // job.name = $(this).find(".hot_pos_l a").attr("title"); //岗位名
        // job.src = $(this).find(".hot_pos_l a").attr("href"); //岗位链接
        // job.city = $(this).find(".hot_pos_l .c9").html(); //岗位所在城市
        // job.salary = $(this).find(".hot_pos_l span").eq(1).html(); //薪资
        // job.exp = $(this).find(".hot_pos_l span").eq(2).html(); //岗位所需经验
        // job.time = $(this).find(".hot_pos_l span").eq(5).html(); //发布时间

        // console.log(job.name);  //控制台输出岗位名
        jobs.push(job);  
    });
    console.log('jobs:',jobs);
    Res.json({  //返回json格式数据给浏览器端
        jobs:jobs
    });
}



function getResponse(res,Res){
    console.log('into to getResponse function!!!');
    var chunks = [];
    var size = 0;
    res.on('data',function(chunk){   //监听事件 传输
        chunks.push(chunk);
        size += chunk.length;
    });
    res.on('end',function(){  //数据传输完
        var data = Buffer.concat(chunks,size);  
        console.log('==============data');
        console.log(data);
        var html = data.toString();
        console.log(html);
        var $ = cheerio.load(html); //cheerio模块开始处理 DOM处理
        var jobs = [];

        var jobs_list = $(".job-list>ul>li>.job-primary");
        jobs_list.each(function(){   //对页面岗位栏信息进行处理  每个岗位对应一个 li  ,各标识符到页面进行分析得出
            var job = {};
            job.name = $(this).find('.info-primary .name .job-title');//岗位名
            job.wages = $(this).find('.info-primary .name .red');//工资
            job.company = $(this).find(".hot_pos_r div").eq(1).find("a").html(); //公司名


            
            // job.period = $(this).find(".hot_pos_r span").eq(1).html(); //阶段
            // job.scale = $(this).find(".hot_pos_r span").eq(2).html(); //规模

            // job.name = $(this).find(".hot_pos_l a").attr("title"); //岗位名
            // job.src = $(this).find(".hot_pos_l a").attr("href"); //岗位链接
            // job.city = $(this).find(".hot_pos_l .c9").html(); //岗位所在城市
            // job.salary = $(this).find(".hot_pos_l span").eq(1).html(); //薪资
            // job.exp = $(this).find(".hot_pos_l span").eq(2).html(); //岗位所需经验
            // job.time = $(this).find(".hot_pos_l span").eq(5).html(); //发布时间

            console.log(job.name);  //控制台输出岗位名
            jobs.push(job);  
        });
        Res.json({  //返回json格式数据给浏览器端
            jobs:jobs
        });
    });
}


module.exports = router;