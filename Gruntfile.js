//jshint maxcomplexity: 12, maxstatements: false

var sauceConfig = require('./build/sauce.conf');
module.exports = function (grunt) {
	'use strict';

	function mapToUrl(files, port) {
		return grunt.file.expand(files).map(function (file) {
			return 'http://localhost:' + port + '/' + file;
		});
	}

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-continue');
	grunt.loadNpmTasks('grunt-mocha');
	grunt.loadNpmTasks('grunt-saucelabs');
	grunt.loadTasks('build/tasks');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: ['dist', 'tmp'],
		concat: {
			engine: {
				src: [
					'lib/intro.stub',
					'bower_components/simple-clone/lib/index.js',
					'bower_components/element-matches/lib/index.js',
					'bower_components/escape-selector/lib/index.js',
					'bower_components/node-uuid/uuid.js',
					'lib/core/index.js',
					'lib/core/*/index.js',
					'lib/core/**/index.js',
					'lib/core/**/*.js',
					'<%= configure.rules.dest.auto %>',
					'lib/core/export.js',
					'lib/outro.stub'
				],
				dest: 'dist/axe.js',
				options: {
					process: true
				}
			},
			commons: {
				src: [
					'lib/commons/intro.stub',
					'lib/commons/index.js',
					'lib/commons/*/index.js',
					'lib/commons/**/*.js',
					'lib/commons/export.js',
					'lib/commons/outro.stub'
				],
				dest: 'tmp/commons.js'
			}
		},
		configure: {
			rules: {
				src: ['<%= concat.commons.dest %>'],
				options: {
					tags: grunt.option('tags')
				},
				dest: {
					auto: 'tmp/rules.js',
					descriptions: 'doc/rule-descriptions.md'
				}
			}
		},
		validate: {
			tools: {
				options: {
					type: 'tool'
				},
				src: 'lib/tools/**/*.json'
			},
			check: {
				options: {
					type: 'check'
				},
				src: 'lib/checks/**/*.json'
			},
			rule: {
				options: {
					type: 'rule'
				},
				src: 'lib/rules/**/*.json'
			}
		},
		uglify: {
			lib: {
				files: [{
					src: ['<%= concat.engine.dest %>'],
					dest: 'dist/axe.min.js'
				}],
				options: {
					preserveComments: 'some'
				}
			},
			beautify: {
				files: [{
					src: ['<%= concat.engine.dest %>'],
					dest: '<%= concat.engine.dest %>'
				}],
				options: {
					mangle: false,
					compress: false,
					beautify: true,
					preserveComments: 'some'
				}
			}
		},
		copy: {
			manifests: {
				files: [{
					src: ['package.json'],
					dest: 'dist/'
				}, {
					src: ['README.md'],
					dest: 'dist/'
				}, {
					src: ['bower.json'],
					dest: 'dist/'
				}, {
					src: ['LICENSE'],
					dest: 'dist/'
				}]
			}
		},
		watch: {
			files: ['lib/**/*', 'test/**/*.js'],
			tasks: ['build', 'testconfig', 'fixture']
		},
		testconfig: {
			test: {
				src: ['test/integration/rules/**/*.json'],
				dest: 'tmp/integration-tests.js'
			}
		},
		fixture: {
			engine: {
				src: '<%= concat.engine.src %>',
				dest: 'test/core/index.html',
				options: {
					fixture: 'test/runner.tmpl',
					testCwd: 'test/core'
				}
			},
			checks: {
				src: [
					'bower_components/simple-clone/lib/index.js',
					'bower_components/element-matches/lib/index.js',
					'bower_components/escape-selector/lib/index.js',
					'build/test/engine.js',
					'<%= configure.rules.dest.auto %>'
				],
				dest: 'test/checks/index.html',
				options: {
					fixture: 'test/runner.tmpl',
					testCwd: 'test/checks'
				}
			},
			commons: {
				src: [
					'bower_components/simple-clone/lib/index.js',
					'bower_components/element-matches/lib/index.js',
					'bower_components/escape-selector/lib/index.js',
					'build/test/engine.js',
					'<%= configure.rules.dest.auto %>'
				],
				dest: 'test/commons/index.html',
				options: {
					fixture: 'test/runner.tmpl',
					testCwd: 'test/commons'
				}
			},
			integration: {
				src: ['<%= concat.engine.dest %>'],
				dest: 'test/integration/rules/index.html',
				options: {
					fixture: 'test/runner.tmpl',
					testCwd: 'test/integration/rules',
					tests: ['../../../tmp/integration-tests.js', 'runner.js']
				}
			}
		},
		mocha: {
			test: {
				options: {
					urls: ['http://localhost:<%= connect.test.options.port %>/test/core/'],
					run: true,
					mocha: {
						grep: grunt.option('grep')
					}
				}
			},
			checks: {
				options: {
					urls: ['http://localhost:<%= connect.test.options.port %>/test/checks/'],
					run: true,
					mocha: {
						grep: grunt.option('grep')
					}
				}
			},
			commons: {
				options: {
					urls: ['http://localhost:<%= connect.test.options.port %>/test/commons/'],
					run: true,
					mocha: {
						grep: grunt.option('grep')
					}
				}
			},
			rules: {
				options: {
					urls: ['http://localhost:<%= connect.test.options.port %>/test/integration/rules/'],
					run: true,
					mocha: {
						grep: grunt.option('grep')
					}
				}
			},
			integration: {
				options: {
					urls: mapToUrl(['test/integration/full/**/*.html', '!test/integration/full/**/frames/**/*.html'],
						'<%= connect.test.options.port %>'),
					run: true,
					mocha: {
						grep: grunt.option('grep')
					}
				}
			}
		},
		'saucelabs-mocha': {
			core: sauceConfig('core', 'http://localhost:<%= connect.test.options.port %>/test/core/'),
			commons: sauceConfig('commons', 'http://localhost:<%= connect.test.options.port %>/test/commons/'),
			checks: sauceConfig('checks', 'http://localhost:<%= connect.test.options.port %>/test/checks/'),
			rules: sauceConfig('rules', 'http://localhost:<%= connect.test.options.port %>/test/integration/')
		},
		connect: {
			test: {
				options: {
					hostname: '0.0.0.0',
					port: grunt.option('port') || 9876,
					base: ['.']
				}
			}
		},
		jshint: {
			axe: {
				options: {
					jshintrc: true,
					reporter: grunt.option('report') ? 'checkstyle' : undefined,
					reporterOutput: grunt.option('report') ? 'tmp/lint.xml' : undefined
				},
				src: ['lib/**/*.js', 'test/**/*.js', 'build/tasks/**/*.js', 'doc/**/*.js', 'Gruntfile.js']
			}
		}
	});

	grunt.registerTask('default', ['build']);

	grunt.registerTask('build', ['clean', 'validate', 'concat:commons', 'configure',
		'concat:engine', 'copy', 'uglify']);

	grunt.registerTask('test', ['build',  'testconfig', 'fixture', 'connect',
		'mocha', 'jshint']);

	grunt.registerTask('test-ci', ['build', 'fixture', 'connect', 'continue:on', 'saucelabs-mocha',
		'continue:off', 'mocha:integration', 'jshint', 'continue:fail-on-warning']);
};
