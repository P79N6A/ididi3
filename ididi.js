var fis = module.exports = require('../fis3');

console.log('use local fis3');

var preprocessor = require('./plugin/preprocessor.js');

fis.cli.name = 'didi3';

fis.cli.info = fis.util.readJSON(__dirname + '/package.json');

fis.cli.version = require('./version.js');

fis.cli.help.commands = ['release', 'install', 'server', 'init'];

// 添加后缀优先级, didi3, fis3.
fis.require.prefixes = ['didi3', 'didi', 'fis3', 'fis'];

var releaseDir = '/static/release/';

var postpackager = ['autoload'];

// TODO
var argv = process.argv;
var isPreview = !(~argv.indexOf('-d') || ~argv.indexOf('--dest'));
// auto generate smarty.conf
if (isPreview) {
    postpackager.push(require('./plugin/smarty-config.js'));
}


// 设置匹配配置.
// fis3 采用match方式配置内置__match属性
// 因此需要额外的setKey才可以全局获取配置参数
var map = [{
    reg: '**.{css,less}',
    rules: {
        parser: fis.plugin('less', {}),
        preprocessor: preprocessor.CSS,
        release: '${releaseDir}$&',
        isMod: true
    }
}, {
    reg: '**.html',
    rules: {
        preprocessor: preprocessor.HTML
    }
}, {
    reg: '**.{tmpl, tpl}',
    rules: {
        // optimizer: fis.plugin('html-minifier'),
        useOptimizer: false,
        release: false,
        isJsLike: true,
        parser: fis.plugin('utc', {})
    }
}, {
    // 所有的js, 默认jswrapper, 且使用amd.
    reg: /.*\.js/,
    rules: {
        preprocessor: preprocessor.JS,
        release: '${releaseDir}$&',
        isMod: true,
        postprocessor: fis.plugin('jswrapper', {
            type: 'amd'
        }, 'append')
    }
}, {
    reg: '*.{js,tpl,html}',
    rules: {
        isMod: true,
        postprocessor: fis.plugin('require-async', {}, 'append')
    }
}, {
    reg: /.+?(png|jpeg|jpg|gif)$/,
    rules: {
        release: '${releaseDir}$&',
    }
}, {
    reg: /.+\.(svg|eot|ttf|woff)$/,
    rules: {
        release: "${releaseDir}/$&"
    }
}, {
    reg: /\/template\/([^\/]+)\/main\.tpl/,
    rules: {
        isMod: true,
        release: 'template/$1.tpl'
    }
}, {
    // json文件不适用模块.
    reg: '/{component_modules, components}/**/*.json',
    rules: {
        isMod: false
    }
}, {
    reg: /^\/component_modules\/(.*)\.(styl|less|css)$/i,
    rules: {
        id: '$1.css',
        useSprite: true,
        isMod: true,
        release: '${releaseDir}/$&'
    }
}, {
    // 下划线为前缀的js文件不适用模块化封装.
    reg: /^\/component_modules(\/[^\/]+)*\/_[^\/]+(\/[^\/]+)*\.js$/,
    rules: {
        isMod: false,
        release: '${releaseDir}$0'
    }
}, {
    reg: /^\/component_modules\/(.*\.js)$/i,
    rules: {
        id: '$1',
        isMod: true,
        release: '${releaseDir}/$&'
    }
}, {
    reg: /^\/components\/(.*)\.(styl|less|css)$/i,
    rules: {
        id: '$1.css',
        useSprite: true,
        isMod: true,
        release: '${releaseDir}/$&'
    }
}, {
    reg: /^\/components\/([^\/]+)\/\1\.js$/i,
    rules: {
        id: '$1',
        isMod: true,
        release: '${releaseDir}/$&'
    }
}, {
    // 下划线为前缀的js文件不适用模块化封装.
    reg: /^\/components(\/[^\/]+)*\/_[^\/]+(\/[^\/]+)*\.js$/,
    rules: {
        isMod: false,
        release: '${releaseDir}$0',
    }
}, {
    reg: /^\/components\/(.*\.js)$/i,
    rules: {
        id: '$1',
        isMod: true,
        release: '${releaseDir}/$&'
    }
}, {
    reg: 'rewrite.conf',
    rules: {
        release: '/server-conf/rewrite.conf'
    }
}, {
    reg: '/mock/**',
    rules: {
        useCompile: false,
        release: '$&'
    }
}, {
    reg: 'proxy.php',
    rules: {
        useCompile: false,
        release: '/proxy.php'
    }
}, {
    reg: /\/test\/([^\/]+)\/main\.php/,
    rules: {
        isMod: false,
        release: 'test/$1.php'
    }
}, {
    reg: /\/page\/([^\/]+)\/main\.html/,
    rules: {
        isMod: true,
        release: 'page/$1.html'
    }
}, {
    // 根目录下面的lib不适用模块化封装.
    reg: '/lib/**.js',
    rules: {
        release: '${releaseDir}$&',
        isMod: false,
    }
}, {
    // 下划线开头的js文件不适用模块化封装.
    reg: /(\/[^\/]+)*\/_[^\/]+(\/[^\/]+)*\.js$/,
    rules: {
        release: '${releaseDir}$0',
        isMod: false
    }
}, {
    // fis3默认不开启同名依赖.
    reg: '**',
    rules: {
        useSameNameRequire: true
    }
}, {
    // autoload插件解决资源加载问题.
    reg: '::packager',
    rules: {
        spriter: fis.plugin('csssprites'),
        postpackager: fis.plugin('autoload')
    }
}];

// 将配置参数添加进入match规则. 
map.forEach(function(item, index) {
    fis.match(item.reg, item.rules);
});

// 将配置参数加入全局配置对象中, 方便其他地方获取.
fis.set('roadmap.path', map);

fis.set('releaseDir', releaseDir);

// server初始化下载的pkg.
fis.set('server', {
    rewrite: true,
    libs: 'rewrite,smarty,didi-component/didi-server',
    type: 'php',
    clean: {
        exclude: "fisdata**,smarty**,rewrite**,index.php**,WEB-INF**,combo**"
    }
});

// autoload设置, 对于引入的已经包含require的js文件, 默认会报warning.
// 使用notice.exclude来ignore这些info.
fis.set('settings.postpackager.autoload', {
    useInlineMap: true,
    // include: '/page/**',
    optDeps: false,
    notice: {
        exclude: [/.*/]
    }
});
