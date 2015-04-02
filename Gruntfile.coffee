module.exports = (grunt) ->

  require('load-grunt-tasks')(grunt)
  require('time-grunt')(grunt)

  grunt.initConfig

    nodeunit:
      all: ['tests/*_test.js']

    uglify:
      options:
        mangle: false
      main:
        files:
          'dist/jsonlt.min.js': ['lib/jsonlt.js']

    copy:
      main:
        files: [ {expand: true, flatten: true, src: ['lib/*'], dest: 'dist/', filter: 'isFile'} ]

  ###############################################################
  # Jobs
  ###############################################################

  grunt.registerTask 'test', [
    'nodeunit'
  ]

  grunt.registerTask 'build', [
    'test'
    'copy'
    'uglify'
  ]
