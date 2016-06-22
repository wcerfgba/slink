var gulp = require('gulp');

gulp.task('default', [ 'website' ]);

gulp.task('website', [ 'website_assets' ]);

gulp.task('website_assets', function () {
  gulp.src('website/src/assets/**')
    .pipe(gulp.dest('website/build/'));
});
