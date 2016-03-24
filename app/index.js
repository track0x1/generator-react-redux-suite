'use strict';

var yeoman = require('yeoman-generator');
var _ = require('lodash');
var config = require('./config.json');
var path = require('path');
var ejs = require('ejs');
var nodefs = require("fs");

module.exports = yeoman.generators.Base.extend({

    initializing: function () {
        this.log('Welcome to the React-Redux Suite generator!\n');
        this.log('Use this tool to generate files for Redux action creators, action constants, reducers, and containers.\n');
        this.log('In case you have existing files, you can even write the output to the console and copy what you need.');

        this.actions = [];
        this.hasAsync = true;
    },

    prompting: function () {
        var _this = this,
            callback = this.async();

        var mainPrompt = [{
            name: 'path',
            message: 'Where is the root directory for your generated files?',
            'default': config.path
        }, {
            type: 'expand',
            name: 'outputType',
            message: 'Please choose an output for the generated files:',
            choices: [
                { key: 'c', name: 'Console', value: 'console' },
                { key: 'f', name: 'File', value: 'file' }
            ],
            'default': 1
        }, {
            name: 'containerName',
            message: 'What is your store\'s name?'
        }, {
            type: 'confirm',
            name: 'makeContainerComponent',
            message: 'Do you want to generate a container component?',
            'default': true
        }, {
            type: 'confirm',
            name: 'addAction',
            message: 'Would you like to add an action?',
            'default': true
        }];

        var actionPrompt = [{
            name: 'actionFunc', // actionName is _.toUpper(_.snakeCase(ccf))
            message: 'What is your action\'s name? (camelCase)',
            'default': 'actionName'
        }, {
            name: 'isAsync',
            type: 'confirm',
            message: 'Does your action need to dispatch other actions?',
            'default': false
        }, {
            name: 'actionParams',
            message: 'What parameter will your action accept? (FSA action)',
            type: 'expand',
            choices: [
                {
                    key: 'e',
                    name: 'Error',
                    value: 'error'
                }, {
                    key: 'p',
                    name: 'Payload',
                    value: 'payload'
                }, {
                    key: 'm',
                    name: 'Meta',
                    value: 'meta'
                }, {
                    key: 'n',
                    name: 'None',
                    value: ''
                }
            ],
            'default': 1
        }, {
            type: 'confirm',
            name: 'addAction',
            message: 'Would you like to add another action?',
            'default': false
        }];

        function promptForProps(callback) {
            _this.prompt(actionPrompt, function (rsp) {
                var actionName = _.toUpper(_.snakeCase(rsp.actionFunc));

                _this.actions.push({
                    actionFunc: rsp.actionFunc,
                    actionFuncProper: _.upperFirst(rsp.actionFunc),
                    actionName: actionName,
                    isAsync: rsp.isAsync,
                    actionParams: rsp.actionParams
                });

                if (rsp.addAction) {
                    promptForProps(callback);
                } else {
                    callback();
                }
            });
        }

        function processPath(path) {
            if (path.slice(-1) !== '/') {
                path += '/';
            }

            return path;
        }

        this.prompt(mainPrompt, function (rsp) {
            this.path = processPath(rsp.path);
            this.containerName = rsp.containerName;
            this.makeContainerComponent = rsp.makeContainerComponent;
            this.toConsole = rsp.outputType === 'console' ? true : false;

            if (rsp.addAction) {
                promptForProps(callback);
            } else {
                callback();
            }

        }.bind(this));

    },

    writing: {
        actions: function () {
            if (this.toConsole) {
                console.log('\n\n/****** ACTION CREATOR ******/');
                var file = nodefs.readFileSync(this.templatePath('actionCreator.es6.template'));
                console.log(ejs.render(file.toString(), { containerName: this.containerName, actions: this.actions, hasAsync: this.hasAsync }));
                console.log('\n/****** ACTION CREATOR SPEC ******/');
                file = nodefs.readFileSync(this.templatePath('actionCreatorSpec.es6.template'));
                console.log(ejs.render(file.toString(), { containerName: this.containerName, actions: this.actions, hasAsync: this.hasAsync }));
            } else {
                this.fs.copyTpl(
                    this.templatePath('actionCreator.es6.template'),
                    this.destinationPath(this.path + 'actions/' + this.containerName + 'ActionCreators.es6'),
                    { containerName: this.containerName, actions: this.actions, hasAsync: this.hasAsync }
                );
                this.fs.copyTpl(
                    this.templatePath('actionCreatorSpec.es6.template'),
                    this.destinationPath(this.path + 'actions/__tests__/' + this.containerName + 'ActionCreatorsSpec.es6'),
                    { containerName: this.containerName, actions: this.actions, hasAsync: this.hasAsync }
                );
            }
        },

        constants: function () {
            if (this.toConsole) {
                console.log('\n\n/****** ACTION CONSTANTS ******/');
                var file = nodefs.readFileSync(this.templatePath('actionConstants.es6.template'));
                console.log(ejs.render(file.toString(), { actions: this.actions }));
            } else {
                this.fs.copyTpl(
                    this.templatePath('actionConstants.es6.template'),
                    this.destinationPath(this.path + 'constants/' + this.containerName + 'Constants.es6'),
                    { actions: this.actions }
                );
            }
        },

        container: function () {
            if (this.makeContainerComponent) {
                if (this.toConsole) {
                    console.log('\n\n/****** CONTAINER COMPONENT ******/');
                    var file = nodefs.readFileSync(this.templatePath('containerComponent.jsx.template'));
                    console.log(ejs.render(file.toString(), { containerName: this.containerName, actions: this.actions }));
                    console.log('\n/****** CONTAINER COMPONENT SPEC ******/');
                    file = nodefs.readFileSync(this.templatePath('containerComponentSpec.jsx.template'));
                    console.log(ejs.render(file.toString(), { containerName: this.containerName, actions: this.actions, hasAsync: this.hasAsync }));
                } else {
                    this.fs.copyTpl(
                        this.templatePath('containerComponent.jsx.template'),
                        this.destinationPath(this.path + 'containers/' + this.containerName + '/' +
                        this.containerName + '.jsx'),
                        { containerName: this.containerName, actions: this.actions }
                    );
                    this.fs.copyTpl(
                        this.templatePath('containerComponentSpec.jsx.template'),
                        this.destinationPath(this.path + 'containers/' + this.containerName + '/__tests__/' +
                        this.containerName + 'Spec.jsx'),
                        { containerName: this.containerName, actions: this.actions }
                    );
                }
            }
        },

        reducers: function () {
            if (this.toConsole) {
                console.log('\n\n/****** REDUCERS ******/');
                var file = nodefs.readFileSync(this.templatePath('containerReducers.es6.template'));
                console.log(ejs.render(file.toString(), { containerName: this.containerName, actions: this.actions }));
                console.log('\n/****** REDUCERS SPEC ******/');
                file = nodefs.readFileSync(this.templatePath('containerReducersSpec.es6.template'));
                console.log(ejs.render(file.toString(), { containerName: this.containerName, actions: this.actions }));
            } else {
                this.fs.copyTpl(
                    this.templatePath('containerReducers.es6.template'),
                    this.destinationPath(this.path + 'reducers/' + this.containerName + 'Reducers.es6'),
                    { containerName: this.containerName, actions: this.actions }
                );
                this.fs.copyTpl(
                    this.templatePath('containerReducersSpec.es6.template'),
                    this.destinationPath(this.path + 'reducers/__tests__/' + this.containerName + 'ReducersSpec.es6'),
                    { containerName: this.containerName, actions: this.actions }
                );
            }
        }
    }
});
