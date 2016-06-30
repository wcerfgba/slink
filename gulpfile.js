var gulp = require('gulp');
var hb = require('gulp-hb');
var sass = require('gulp-sass');
var run = require('gulp-run');
var concat = require('gulp-concat');
var wrap = require('gulp-wrap');

gulp.task('default', [ 'website' ]);

gulp.task('webextension', [ 'webextension_unpacked', 'webextension_firefox',
                            'webextension_chrome' ]);

gulp.task('webextension_unpacked', function () {
  return gulp.src('webextension/src/**')
          .pipe(gulp.dest('webextension/build/unpacked/'));
});

gulp.task('webextension_firefox', [ 'webextension_unpacked' ], function () {
  run('cd webextension/build/unpacked/ ; rm ../slink_firefox.xpi ; zip -r ../slink_firefox.xpi *')
    .exec();
});

gulp.task('webextension_chrome', [ 'webextension_unpacked' ], function () {
  run('cd webextension/build/ ; chromium --pack-extension=unpacked ; mv unpacked.crx slink_chrome.crx ; mv unpacked.pem slink_chrome_private_key.pem')
    .exec();
});

// Currently broken.
gulp.task('webextension_bookmarklet', [ 'webextension_unpacked' ], function () {
  return gulp.src('webextension/build/unpacked/slink.js')
          .pipe(concat('slinkBookmarklet.hbs'))
          .pipe(wrap('<a href="javascript:{<%= contents %>};void(0);">slink</a>'))
          .pipe(gulp.dest('website/src/templates/'));
});

gulp.task('website', [ 'website_templates', 'website_scss', 'website_assets' ]);

gulp.task('website_templates', function () {
  gulp.src('website/src/templates/*.html')
    .pipe(hb({
      partials: 'website/src/templates/*.hbs',
    }))
    .pipe(gulp.dest('website/build/'));
});

gulp.task('website_scss', function () {
  gulp.src('website/src/scss/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('website/build/'));
});

gulp.task('website_assets', function () {
  gulp.src('website/src/assets/**', { dot: true })
    .pipe(gulp.dest('website/build/'));
});
