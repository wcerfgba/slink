var gulp = require('gulp');
var hb = require('gulp-hb');
var sass = require('gulp-sass');

gulp.task('default', [ 'website' ]);

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
  gulp.src('website/src/assets/**')
    .pipe(gulp.dest('website/build/'));
});
