var fis = module.exports = require('../fis3');

console.log('use local fis3');

var preprocessor = require('./plugin/preprocessor.js');

fis.cli.name = 'didi3';

fis.cli.info = fis.util.readJSON(__dirname + '/package.json');

fis.cli.version = require('./version.js');

fis.cli.help.commands = ['release', 'install', 'server', 'init'];

fis.require.prefixes = ['didi3', 'didi', 'fis3', 'fis'];

var releaseDir = '/static/release/';

fis.set('releaseDir', releaseDir);

fis.match('*.{css,less}', {
    parser: fis.plugin('less', {})
});

fis.match('*.{tmpl}', {
    parser: fis.plugin('utc', {})
});

fis.match('*.js', {
    postprocessor: fis.plugin('jswrapper', {
        type: 'amd'
    })
});

fis.match('*.tpl', {
    optimizer: fis.plugin('html-minifier')
});

fis.match('*.{js,tpl,html}', {
    postprocessor: fis.plugin('require-async', {}, 'append')
});

fis.match('::packager', {
    spriter: fis.plugin('csssprites')
});

fis.match(/^\/component_modules\/(.*)\.(styl|less|css)$/i, {
    id: '$1.css',
    useSprite: true,
    isMod: true,
    release: '${releaseDir}/$&'
}).match(/^\/component_modules(\/[^\/]+)*\/_[^\/]+(\/[^\/]+)*\.js$/, {
    isMod: false,
    release: '${releaseDir}$0',
}).match(/^\/component_modules\/(.*\.js)$/i, {
    id: '$1',
    isMod: true,
    release: '${releaseDir}/$&'
}).match(/^\/components\/(.*)\.(styl|less|css)$/i, {
    id: '$1.css',
    useSprite: true,
    isMod: true,
    release: '${releaseDir}/$&'
}).match(/^\/components\/([^\/]+)\/\1\.js$/i, {
    id: '$1',
    isMod: true,
    release: '${releaseDir}/$&'
}).match(/^\/components(\/[^\/]+)*\/_[^\/]+(\/[^\/]+)*\.js$/, {
    isMod: false,
    release: '${releaseDir}$0',
}).match(/^\/components\/(.*\.js)$/i, {
    id: '$1',
    isMod: true,
    release: '${releaseDir}/$&'
}).match('rewrite.conf', {
    release: '/server-conf/rewrite.conf'
}).match('/mock/**', {
    useCompile: false,
    release: '$&'
}).match('proxy.php', {
    useCompile: false,
    release: '/proxy.php'
}).match(/\/test\/([^\/]+)\/main\.php/, {
    isMod: false,
    release: 'test/$1.php'
}).match(/\/page\/([^\/]+)\/main\.html/, {
    isMod: true,
    release: 'page/$1.html'
}).match('lib/**.js', {
    release: '${releaseDir}$&',
    isMod: false,
}).match(/(\/[^\/]+)*\/_[^\/]+(\/[^\/]+)*\.js$/, {
    release: '${releaseDir}$0',
    isMod: false
}).match('**.js', {
    release: '${releaseDir}$&',
    isMod: true
}).match('**.css', {
    release: '${releaseDir}$&',
    isMod: true
}).match('**tmpl', {
    useOptimizer: false,
    release: false,
    isJsLike: true
}).match(/.+?(png|jpeg|jpg|gif)$/, {
    release: '${releaseDir}$&',
}).match(/.+\.(svg|eot|ttf|woff)$/, {
    release: "${releaseDir}/$&"
}).match(/\/template\/([^\/]+)\/main\.tpl/, {
    isMod: true,
    release: 'template/$1.tpl'
});

// fis.set('system.repos', '');

fis.set('server', {
    rewrite: true,
    libs: 'rewrite,smarty,didi-component/didi-server',
    type: 'php',
    clean: {
        exclude: "fisdata**,smarty**,rewrite**,index.php**,WEB-INF**,combo**"
    }
})

var postpackager = ['autoload'];

var argv = process.argv;
var isPreview = !(~argv.indexOf('-d') || ~argv.indexOf('--dest'));
// auto generate smarty.conf
if (isPreview) {
    postpackager.push(require('./plugin/smarty-config.js'));
}

fis.match('::packager', {
    releaseDir: releaseDir,
    //各个流程的配置
    modules: {
        preprocessor: {
            css: preprocessor.CSS,
            js: preprocessor.JS,
            html: preprocessor.HTML
        },
        postpackager: postpackager
    },
    settings: {
        postpackager: {
            autoload: {
                useInlineMap: true,
                // include: '/page/**',
                optDeps: false
            }
        }
    }
})
