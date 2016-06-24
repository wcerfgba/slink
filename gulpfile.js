var gulp = require('gulp');
var hb = require('gulp-hb');

gulp.task('default', [ 'website' ]);

gulp.task('website', [ 'website_templates', 'website_assets' ]);

gulp.task('website_templates', function () {
  gulp.src('website/src/templates/*.html')
    .pipe(hb({
      partials: 'website/src/templates/*.hbs',
    }))
    .pipe(gulp.dest('website/build/'));
});

gulp.task('website_assets', function () {
  gulp.src('website/src/assets/**')
    .pipe(gulp.dest('website/build/'));
});
