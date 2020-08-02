const project_folder = 'dist',
	  source_folder = '#src',
	  fs = require('fs');

const path = {
	build: {
		html: project_folder + '/',
		css: project_folder + '/css/',
		js: project_folder + '/js/',
		img: project_folder + '/img/',
		fonts: project_folder + '/fonts/'
	},

	src: {
		html: [source_folder + '/*.html', '!' + source_folder + '/_*.html'],
		css: source_folder + '/scss/style.scss',
		js: source_folder + '/js/script.js',
		img: source_folder + '/img/**/*.{png,jpg,svg,gif,ico,webp}',
		fonts: source_folder + '/fonts/*.ttf'
	},

	watch: {
		html: source_folder + '/**/*.html',
		css: source_folder + '/scss/**/*.scss',
		js: source_folder + '/js/**/*.js',
		img: source_folder + '/img/**/*.{png,jpg,svg,gif,ico,webp}',
	},

	clean: './' + project_folder + '/'
};

const {src, dest} = require('gulp'),
	gulp = require('gulp'),
	browsersync = require('browser-sync').create(),
	fileinclude = require('gulp-file-include'),
	del = require('del'),
	scss = require('gulp-sass'),
	autoprefixer = require('gulp-autoprefixer'),
	group_media = require('gulp-group-css-media-queries'),
	clean_css = require('gulp-clean-css'),
	rename = require('gulp-rename'),
	uglify_es = require('gulp-uglify-es').default,
	babel = require('gulp-babel'),
	imagemin = require('gulp-imagemin'),
	webp = require('gulp-webp'),
	webpHtml = require('gulp-webp-html'),
	webpcss = require('gulp-webpcss'),
	svgSprite = require('gulp-svg-sprite'),
	ttf2woff = require('gulp-ttf2woff'),
	ttf2woff2 = require('gulp-ttf2woff2');

const browserSync = (params) => {
	browsersync.init({
		server: {
			baseDir: './' + project_folder + '/'
		},
		port: 3000,
		notify: false
	});
};

const html = () => {
	return src(path.src.html)
	.pipe(fileinclude())
	.pipe(webpHtml())
	.pipe(dest(path.build.html))
	.pipe(browsersync.stream())
};

const css = () => {
	return src(path.src.css)
	.pipe(scss({outputStyle: 'expanded'}).on('error', scss.logError))
	.pipe(group_media())
	.pipe(autoprefixer({
		overrideBrowserslist: ['last 5 versions'],
		cascade: true,
	}))
	.pipe(webpcss())
	.pipe(dest(path.build.css))
	.pipe(clean_css())
	.pipe(rename({
		extname: '.min.css'
	}))
	.pipe(dest(path.build.css))
	.pipe(browsersync.stream())
}

const js = () => {
	return src(path.src.js)
	.pipe(fileinclude())
	.pipe(dest(path.build.js))
	.pipe(babel({
		presets: ['@babel/env']
	}))
	.pipe(uglify_es())
	.pipe(rename({
		extname: '.min.js'
	}))
	.pipe(dest(path.build.js))
	.pipe(browsersync.stream())
};

const imgages = () => {
	return src(path.src.img)
	.pipe(
		webp({
			quality: 70
		})
	)
	.pipe(dest(path.build.img))
	.pipe(src(path.src.img))
	.pipe(imagemin({
		progressive: true,
		interlaced: true,
		svgoPlugins: [{removeViewBox: false}],
		optimizationLevel: 3,
	}))
	.pipe(dest(path.build.img))
	.pipe(browsersync.stream())
};

const fonts = (params) => {
	src(path.src.fonts)
		.pipe(ttf2woff())
		.pipe(dest(path.build.fonts))
	return src(path.src.fonts)
		.pipe(ttf2woff2())
		.pipe(dest(path.build.fonts))
}

gulp.task('svgSprite', () => {
	return gulp.src([source_folder + '/iconsprite/*.svg'])
		.pipe(svgSprite({
			mode: {
				stack: {
					sprite: '../icons/icons.svg',
					example: true
				}
			},
		}
		))
		.pipe(dest(path.build.img))
});


const cb = () => {

}

const fontsStyle = (params) => {
	let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
	if (file_content == '') {
		fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
		return fs.readdir(path.build.fonts, function (err, items) {
			if (items) {
				let c_fontname;
				for (var i = 0; i < items.length; i++) {
					let fontname = items[i].split('.');
					fontname = fontname[0];
					if (c_fontname != fontname) {
						fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
					}
					c_fontname = fontname;
				}
			}
		})
	}
}

const watchFiles = () => {
	gulp.watch([path.watch.html], html);
	gulp.watch([path.watch.css], css);
	gulp.watch([path.watch.js], js);
	gulp.watch([path.watch.img], imgages);
}

const clean = (params) => {
	return del(path.clean);
} 

const build = gulp.series(clean, gulp.parallel(js, css, html, imgages, fonts), fontsStyle);
const watch = gulp.parallel(build, watchFiles, browserSync);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.imgages = imgages;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;